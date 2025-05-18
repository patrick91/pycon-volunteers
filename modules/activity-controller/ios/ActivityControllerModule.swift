import ActivityKit
import SwiftUI
import ExpoModulesCore
import UserNotifications

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
    "Activity Data Error: \(param)"
  }
  
  static func wrap(_ error: Error, context: String) -> ActivityDataException {
    return ActivityDataException("\(context): \(error.localizedDescription)")
  }
}

// MARK: Types

struct StartActivityArgs: Codable {
  let sessionTitle: String
  let endTime: String // ISO string
  let qaTime: String // ISO string
  let roomChangeTime: String // ISO string
  let nextTalk: String?
  let speakerNames: [String]

  public static func fromJSON(rawData: String) -> Result<StartActivityArgs, Error> {
    do {
      log.debug("Attempting to parse JSON data: \(rawData)")
      let decoder = JSONDecoder()
      let data = Data(rawData.utf8)
      let decoded = try decoder.decode(StartActivityArgs.self, from: data)
      log.debug("Successfully parsed JSON data")
      return .success(decoded)
    } catch let error {
      log.error("JSON parsing failed: \(error.localizedDescription)")
      return .failure(error)
    }
  }
}

struct UpdateActivityArgs: Codable {
  let sessionTitle: String
  let endTime: String // ISO string
  let qaTime: String // ISO string
  let roomChangeTime: String // ISO string
  let nextTalk: String?
  let speakerNames: [String]

  public static func fromJSON(rawData: String) -> Result<UpdateActivityArgs, Error> {
    do {
      let decoder = JSONDecoder()
      let data = Data(rawData.utf8)
      let decoded = try decoder.decode(UpdateActivityArgs.self, from: data)
      return .success(decoded)
    } catch let error {
      return .failure(error)
    }
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
  private var qaTimer: Timer?
  private var roomChangeTimer: Timer?
  
  // MARK: Helper functions for date handling
  
  private func parseDate(_ dateString: String, field: String) throws -> Date {
    let formatters: [ISO8601DateFormatter] = [
      {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
      }(),
      {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
      }()
    ]
    
    for formatter in formatters {
      if let date = formatter.date(from: dateString) {
        log.debug("Successfully parsed \(field): \(date)")
        return date
      }
    }
    
    log.error("Failed to parse \(field): \(dateString)")
    throw ActivityDataException("""
      Invalid \(field) format. Expected ISO8601 format, examples:
      - With milliseconds: 2024-03-20T15:30:00.000Z
      - Without milliseconds: 2024-03-20T15:30:00Z
      Got: \(dateString)
      """)
  }
  
  private func validateTimes(endTime: Date, qaTime: Date, roomChangeTime: Date) throws {
    let now = Date()
    log.debug("Validating times - now: \(now), endTime: \(endTime), qaTime: \(qaTime), roomChangeTime: \(roomChangeTime)")
    
    if endTime < now {
      throw ActivityDataException("endTime must be in the future. Current time: \(now), provided endTime: \(endTime)")
    }
    
    if qaTime > endTime {
      throw ActivityDataException("qaTime must be before endTime. qaTime: \(qaTime), endTime: \(endTime)")
    }
    
    if roomChangeTime > endTime {
      throw ActivityDataException("roomChangeTime must be before endTime. roomChangeTime: \(roomChangeTime), endTime: \(endTime)")
    }
  }
  
  private func parseDates(from args: StartActivityArgs) throws -> (endTime: Date, qaTime: Date, roomChangeTime: Date) {
    let endTime = try parseDate(args.endTime, field: "endTime")
    let qaTime = try parseDate(args.qaTime, field: "qaTime")
    let roomChangeTime = try parseDate(args.roomChangeTime, field: "roomChangeTime")
    try validateTimes(endTime: endTime, qaTime: qaTime, roomChangeTime: roomChangeTime)
    return (endTime, qaTime, roomChangeTime)
  }
  
  private func parseDates(from args: UpdateActivityArgs) throws -> (endTime: Date, qaTime: Date, roomChangeTime: Date) {
    let endTime = try parseDate(args.endTime, field: "endTime")
    let qaTime = try parseDate(args.qaTime, field: "qaTime")
    let roomChangeTime = try parseDate(args.roomChangeTime, field: "roomChangeTime")
    try validateTimes(endTime: endTime, qaTime: qaTime, roomChangeTime: roomChangeTime)
    return (endTime, qaTime, roomChangeTime)
  }
  
  private func areNotificationsEnabled() async -> Bool {
    let settings = await UNUserNotificationCenter.current().notificationSettings()
    return settings.authorizationStatus == .authorized
  }
  
  private func sendNotification(title: String, body: String) {
    Task {
      // Only send notification if notifications are enabled
      guard await areNotificationsEnabled() else {
        log.debug("Notifications are not enabled, skipping notification")
        return
      }
      
      let content = UNMutableNotificationContent()
      content.title = title
      content.body = body
      content.sound = .default
      content.interruptionLevel = .timeSensitive
      
      // Create a request without a trigger to send immediately
      let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
      
      do {
        try await UNUserNotificationCenter.current().add(request)
        log.debug("Successfully sent time-sensitive notification: \(title)")
      } catch {
        log.error("Error sending notification: \(error.localizedDescription)")
      }
    }
  }
  
  private func scheduleUpdates(qaTime: Date, roomChangeTime: Date, endTime: Date, sessionTitle: String) {
    // Cancel any existing timers
    qaTimer?.invalidate()
    qaTimer = nil
    roomChangeTimer?.invalidate()
    roomChangeTimer = nil
    
    let now = Date()
    log.debug("Current time: \(now)")
    
    // Schedule Q&A update if it's in the future
    if qaTime > now {
      let qaInterval = qaTime.timeIntervalSince(now)
      log.debug("Creating Q&A timer with interval: \(qaInterval) seconds")
      
      // Create the timer and retain it
      let timer = Timer(timeInterval: qaInterval, repeats: false) { [weak self] timer in
        log.debug("Q&A timer fired")
        self?.updateActivityState(sessionTitle: sessionTitle)
        // Send notification for Q&A
        self?.sendNotification(
          title: "Q&A Time",
          body: "It's time for Q&A in \(sessionTitle)"
        )
        timer.invalidate()
      }
      
      // Store the timer
      self.qaTimer = timer
      
      // Add to RunLoop
      RunLoop.main.add(timer, forMode: .common)
      log.debug("Added Q&A timer to RunLoop.main")
      
      // Ensure timer is valid
      if timer.isValid {
        log.debug("Q&A timer is valid and scheduled for: \(qaTime)")
      } else {
        log.error("Q&A timer is invalid!")
      }
    } else {
      log.debug("Skipping Q&A timer as qaTime (\(qaTime)) is not in the future")
    }
    
    // Schedule room change update if it's in the future
    if roomChangeTime > now {
      let roomChangeInterval = roomChangeTime.timeIntervalSince(now)
      log.debug("Creating room change timer with interval: \(roomChangeInterval) seconds")
      
      // Create the timer and retain it
      let timer = Timer(timeInterval: roomChangeInterval, repeats: false) { [weak self] timer in
        log.debug("Room change timer fired")
        self?.updateActivityState(sessionTitle: "Room Change")
        // Send notification for room change
        self?.sendNotification(
          title: "Room Change",
          body: "It's time to change rooms for the next session"
        )
        timer.invalidate()
      }
      
      // Store the timer
      self.roomChangeTimer = timer
      
      // Add to RunLoop
      RunLoop.main.add(timer, forMode: .common)
      log.debug("Added room change timer to RunLoop.main")
      
      // Ensure timer is valid
      if timer.isValid {
        log.debug("Room change timer is valid and scheduled for: \(roomChangeTime)")
      } else {
        log.error("Room change timer is invalid!")
      }
    } else {
      log.debug("Skipping room change timer as roomChangeTime (\(roomChangeTime)) is not in the future")
    }
  }
  
  private func updateActivityState(sessionTitle: String) {
    log.debug("updateActivityState called with sessionTitle: \(sessionTitle)")
    
    guard #available(iOS 16.2, *) else {
      log.error("iOS 16.2 or later required")
      return
    }
    
    guard let activityWrapper = getCurrentActivity() as? DefinedActivityWrapper else {
      log.error("No active activity found")
      return
    }
    
    let activity = activityWrapper.getActivity()
    let currentState = activity.content.state
    let now = Date()
    
    log.debug("Updating activity state from '\(currentState.sessionTitle)' to '\(sessionTitle)'")
    
    // Create a more precise stale date calculation
    let staleDate: Date
    if now >= currentState.endTime {
      staleDate = now.addingTimeInterval(300)
      log.debug("Using current time + 5min for stale date")
    } else {
      staleDate = currentState.endTime.addingTimeInterval(300)
      log.debug("Using endTime + 5min for stale date")
    }
    
    let updatedState = MyLiveActivityAttributes.MyLiveActivityState(
      endTime: currentState.endTime,
      sessionTitle: sessionTitle,
      qaTime: currentState.qaTime,
      roomChangeTime: currentState.roomChangeTime,
      nextTalk: currentState.nextTalk,
      speakerNames: currentState.speakerNames
    )
    
    Task {
      log.debug("Updating activity with new state")
      await activity.update(
        ActivityContent<MyLiveActivityAttributes.MyLiveActivityState>(
          state: updatedState,
          staleDate: staleDate
        )
      )
      log.debug("Successfully updated activity state to '\(sessionTitle)'")
    }
  }
  
  private func cancelScheduledUpdates() {
    qaTimer?.invalidate()
    qaTimer = nil
    roomChangeTimer?.invalidate()
    roomChangeTimer = nil
    log.debug("Cancelled scheduled updates")
  }

  private func withTimeout<T>(seconds: TimeInterval, operation: @escaping () async throws -> T) async throws -> T {
    try await withThrowingTaskGroup(of: T.self) { group in
        group.addTask {
            try await operation()
        }
        
        group.addTask {
            try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
            throw ActivityDataException("Operation timed out after \(seconds) seconds")
        }
        
        let result = try await group.next()!
        group.cancelAll()
        return result
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

    Function("isLiveActivityRunning") { () -> Bool in
      if #available(iOS 16.2, *) {
        return Activity<MyLiveActivityAttributes>.activities.first != nil
      }
      return false
    }

    AsyncFunction("startLiveActivity") {
      (
        rawData: String,
        promise: Promise
      ) in
      do {
        guard #available(iOS 16.2, *) else {
          throw ActivityUnavailableException(())
        }

        log.debug("Starting live activity with raw data: \(rawData)")

        let args: StartActivityArgs
        switch StartActivityArgs.fromJSON(rawData: rawData) {
        case .success(let parsedArgs):
          args = parsedArgs
        case .failure(let error):
          throw ActivityDataException.wrap(error, context: "JSON parsing failed")
        }

        guard isActivityRunning() == false else {
          throw ActivityAlreadyRunningException(())
        }

        let info = ActivityAuthorizationInfo()
        guard info.areActivitiesEnabled else {
          throw ActivityUnavailableException(())
        }

        let activityAttrs = MyLiveActivityAttributes(
        )

        let (endTime, qaTime, roomChangeTime) = try parseDates(from: args)
        
        let activityState = MyLiveActivityAttributes.MyLiveActivityState(
          endTime: endTime,
          sessionTitle: args.sessionTitle,
          qaTime: qaTime,
          roomChangeTime: roomChangeTime,
          nextTalk: args.nextTalk,
          speakerNames: args.speakerNames
        )

        log.debug("Requesting activity with state: \(activityState)")

        let activity = try Activity.request(
          attributes: activityAttrs,
          content: ActivityContent<MyLiveActivityAttributes.MyLiveActivityState>(
            state: activityState,
            staleDate: endTime.addingTimeInterval(300)
          )
        )

        log.debug("Successfully started activity with ID: \(activity.id)")
        
        scheduleUpdates(qaTime: qaTime, roomChangeTime: roomChangeTime, endTime: endTime, sessionTitle: args.sessionTitle)
        log.debug("Scheduled activity updates")

        return StartActivityReturnType(activityId: Field(wrappedValue: activity.id))
      } catch {
        log.error("Activity start failed with error: \(error)")
        if let activityError = error as? ActivityDataException {
          throw activityError
        } else if let genericError = error as? GenericException<Any> {
          throw genericError
        } else {
          throw ActivityDataException("Unexpected error: \(error.localizedDescription)")
        }
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

      log.debug("Updating live activity with raw data: \(rawData)")

      let args: UpdateActivityArgs
      switch UpdateActivityArgs.fromJSON(rawData: rawData) {
      case .success(let parsedArgs):
        args = parsedArgs
      case .failure(let error):
        throw ActivityDataException.wrap(error, context: "JSON parsing failed")
      }

      guard let activityWrapper = getCurrentActivity() as? DefinedActivityWrapper else {
        throw ActivityNotStartedException(())
      }
      
      let activity = activityWrapper.getActivity()
      
      let (endTime, qaTime, roomChangeTime) = try parseDates(from: args)
      
      
      let updatedState = MyLiveActivityAttributes.MyLiveActivityState(
        endTime: endTime,
        sessionTitle: args.sessionTitle,
        qaTime: qaTime,
        roomChangeTime: roomChangeTime,
        nextTalk: args.nextTalk,
        speakerNames: args.speakerNames
      )
      
      Task {
        log.debug("Attempting to update activity \(activity.id)")
        
        let updatedContent = ActivityContent<MyLiveActivityAttributes.MyLiveActivityState>(
          state: updatedState,
          staleDate: endTime.addingTimeInterval(300) // Add 5 minutes buffer
        )
        
        try await activity.update(updatedContent)
        
        log.debug("Successfully updated activity with ID: \(activity.id)")
        
        // Reschedule updates with new times
        scheduleUpdates(qaTime: qaTime, roomChangeTime: roomChangeTime, endTime: endTime, sessionTitle: args.sessionTitle)
          
        promise.resolve()
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
        // Cancel scheduled updates instead of stopping timer
        cancelScheduledUpdates()
        return promise.resolve()
      }
    }

    Function("isActivityRunning") { () -> Bool in
      return isActivityRunning()
    }
  }
}
