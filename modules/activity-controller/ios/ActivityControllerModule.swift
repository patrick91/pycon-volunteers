import ActivityKit
import SwiftUI
import ExpoModulesCore

// MARK: Exceptions

final class ActivityUnavailableException: GenericException<Void> {
  override var reason: String {
    "Live activities are not available on this system."
  }
}

final class ActivityFailedToStartException: GenericException<Void> {
  override var reason: String {
    "Live activity couldn't be launched."
  }
}

final class ActivityNotStartedException: GenericException<Void> {
  override var reason: String {
    "Live activity has not started yet."
  }
}

final class ActivityAlreadyRunningException: GenericException<Void> {
  override var reason: String {
    "Live activity is already running."
  }
}

final class ActivityDataException: GenericException<String> {
  override var reason: String {
    "The data passed down to the Live Activity is incorrect. \(param)"
  }
}

// MARK: Types

struct StartActivityArgs: Codable {
  let customString: String
  let customNumber: Int
  let eventName: String
  let endTime: String // ISO string
  let qaTime: String // ISO string
  let roomChangeTime: String // ISO string
  let nextTalk: String?

  public static func fromJSON(rawData: String) -> Self? {
    let decoder = JSONDecoder()
    return try? decoder.decode(self, from: Data(rawData.utf8))
  }
}

struct UpdateActivityArgs: Codable {
  let eventName: String
  let endTime: String // ISO string
  let qaTime: String // ISO string
  let roomChangeTime: String // ISO string
  let nextTalk: String?

  public static func fromJSON(rawData: String) -> Self? {
    let decoder = JSONDecoder()
    return try? decoder.decode(self, from: Data(rawData.utf8))
  }
}

protocol ActivityWrapper {}

@available(iOS 16.2, *)
class DefinedActivityWrapper: ActivityWrapper {
  private var activity: Activity<MyLiveActivityAttributes>

  init(_ activity: Activity<MyLiveActivityAttributes>) {
    self.activity = activity
  }

  public func setActivity(activity: Activity<MyLiveActivityAttributes>) {
    self.activity = activity
  }

  public func getActivity() -> Activity<MyLiveActivityAttributes> {
    return self.activity
  }
}

struct FallbackActivityWrapper: ActivityWrapper {}

struct StartActivityReturnType: Record {
  @Field
  var activityId: String
}

// MARK: Helper functions

func getCurrentActivity() -> ActivityWrapper? {
  guard #available(iOS 16.2, *) else {
    return nil
  }

  if let activity = Activity<MyLiveActivityAttributes>.activities.first {
    return DefinedActivityWrapper(activity)
  } else {
    return nil
  }
}

func isActivityRunning() -> Bool {
  return getCurrentActivity() != nil
}

// MARK: Module definition

public class ActivityControllerModule: Module {
  private var activityWrapper: ActivityWrapper?
  private var updateTimer: Timer?
  
  private func startUpdateTimer() {
    // Stop any existing timer
    updateTimer?.invalidate()
    updateTimer = nil
    
    log.debug("Starting update timer")
    
    // Ensure timer is created and scheduled on the main thread
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      
      log.debug("Creating timer on main thread")
      self.updateTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
        log.debug("Timer fired")
        self?.checkAndUpdateActivity()
      }
      
      // Add timer to main run loop
      RunLoop.main.add(self.updateTimer!, forMode: .common)
      log.debug("Timer added to run loop")
    }
  }
  
  private func stopUpdateTimer() {
    log.debug("Stopping update timer")
    DispatchQueue.main.async { [weak self] in
      self?.updateTimer?.invalidate()
      self?.updateTimer = nil
      log.debug("Timer stopped and invalidated")
    }
  }
  
  private func checkAndUpdateActivity() {
    guard #available(iOS 16.2, *) else { return }
    guard let activityWrapper = getCurrentActivity() as? DefinedActivityWrapper else { return }
    
    let activity = activityWrapper.getActivity()
    let currentState = activity.content.state
    let currentTime = Date()
    
    // Calculate remaining time until Q&A and room change
    let remainingQATime = currentState.qaTime.timeIntervalSince(currentTime)
    let remainingRoomChangeTime = currentState.roomChangeTime.timeIntervalSince(currentTime)
    
    log.debug("remainingQATime: \(remainingQATime)")
    log.debug("remainingRoomChangeTime: \(remainingRoomChangeTime)")
    
    // If either timer has reached zero, update the activity
    if remainingQATime <= 0 || remainingRoomChangeTime <= 0 {
      let updatedState = MyLiveActivityAttributes.MyLiveActivityState(
        endTime: currentState.endTime,
        eventName: remainingQATime <= 0 ? "Q&A" : "Room Change",
        qaTime: currentState.qaTime,
        roomChangeTime: currentState.roomChangeTime,
        nextTalk: currentState.nextTalk
      )
      
      Task {
        await activity.update(
          ActivityContent<MyLiveActivityAttributes.MyLiveActivityState>(
            state: updatedState,
            staleDate: currentState.endTime.addingTimeInterval(300)
          )
        )
      }
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ActivityController")

    Property("areLiveActivitiesEnabled") {
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    AsyncFunction("startLiveActivity") {
      (
        rawData: String,
        promise: Promise
      ) in
      guard #available(iOS 16.2, *) else {
        throw ActivityUnavailableException(())
      }

      guard let args = StartActivityArgs.fromJSON(rawData: rawData) else {
        throw ActivityDataException("Failed to parse activity arguments")
      }

      guard isActivityRunning() == false else {
        throw ActivityAlreadyRunningException(())
      }

      let info = ActivityAuthorizationInfo()
      guard info.areActivitiesEnabled else {
        throw ActivityUnavailableException(())
      }

      do {
        let activityAttrs = MyLiveActivityAttributes(
          customString: args.customString, customNumber: args.customNumber
        )

        // Parse the date strings with better error handling
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime]
        
        guard let endTime = dateFormatter.date(from: args.endTime) else {
          throw ActivityDataException("Invalid endTime format: \(args.endTime)")
        }
        
        guard let qaTime = dateFormatter.date(from: args.qaTime) else {
          throw ActivityDataException("Invalid qaTime format: \(args.qaTime)")
        }
        
        guard let roomChangeTime = dateFormatter.date(from: args.roomChangeTime) else {
          throw ActivityDataException("Invalid roomChangeTime format: \(args.roomChangeTime)")
        }
        
        let activityState = MyLiveActivityAttributes.MyLiveActivityState(
          endTime: endTime,
          eventName: args.eventName,
          qaTime: qaTime,
          roomChangeTime: roomChangeTime,
          nextTalk: args.nextTalk
        )

        let activity = try Activity.request(
          attributes: activityAttrs,
          content: ActivityContent<MyLiveActivityAttributes.MyLiveActivityState>(
            state: activityState,
            staleDate: endTime.addingTimeInterval(300) // Add 5 minutes buffer
          )
        )

        log.debug("Started \(activity.id)")
        
        // Start the update timer
        startUpdateTimer()

        return StartActivityReturnType(activityId: Field(wrappedValue: activity.id))
      } catch let error {
        print(error.localizedDescription)
        throw ActivityFailedToStartException(())
      }
    }
    
    AsyncFunction("updateLiveActivity") {
      (
        rawData: String,
        promise: Promise
      ) in
      guard #available(iOS 16.2, *) else {
        throw ActivityUnavailableException(())
      }

      guard let args = UpdateActivityArgs.fromJSON(rawData: rawData) else {
        throw ActivityDataException(rawData)
      }

      guard let activityWrapper = getCurrentActivity() as? DefinedActivityWrapper else {
        throw ActivityNotStartedException(())
      }
      
      let activity = activityWrapper.getActivity()
      
      // Parse the date strings
      let dateFormatter = ISO8601DateFormatter()
      guard let endTime = dateFormatter.date(from: args.endTime),
            let qaTime = dateFormatter.date(from: args.qaTime),
            let roomChangeTime = dateFormatter.date(from: args.roomChangeTime) else {
        throw ActivityDataException("Invalid date format")
      }
      
      let updatedState = MyLiveActivityAttributes.MyLiveActivityState(
        endTime: endTime,
        eventName: args.eventName,
        qaTime: qaTime,
        roomChangeTime: roomChangeTime,
        nextTalk: args.nextTalk
      )
      
      Task {
        await activity.update(
          ActivityContent<MyLiveActivityAttributes.MyLiveActivityState>(
            state: updatedState,
            staleDate: endTime.addingTimeInterval(300) // Add 5 minutes buffer
          )
        )
        
        log.debug("Updated activity \(activity.id)")
        return promise.resolve()
      }
    }

    AsyncFunction("stopLiveActivity") { (promise: Promise) in
      guard #available(iOS 16.2, *) else {
        throw ActivityUnavailableException(())
      }

      guard let activity = (getCurrentActivity() as? DefinedActivityWrapper)?.getActivity() else {
        throw ActivityNotStartedException(())
      }

      log.debug("Stopping activity \(activity.id)")

      Task {
        await activity.end(nil, dismissalPolicy: .immediate)
        log.debug("Stopped activity \(activity.id)")
        // Stop the update timer
        stopUpdateTimer()
        return promise.resolve()
      }
    }

    Function("isActivityRunning") { () -> Bool in
      return isActivityRunning()
    }
  }
}
