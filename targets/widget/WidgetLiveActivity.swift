import ActivityKit
import WidgetKit
import SwiftUI

struct WidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MyLiveActivityAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack(spacing: 12) {
                Text(context.attributes.customString)
                    .font(.headline)
                
                VStack(spacing: 4) {
                    let currentTime = Date()
                    let remainingQATime = context.state.qaTime.timeIntervalSince(currentTime)
                    let remainingRoomChangeTime = context.state.roomChangeTime.timeIntervalSince(currentTime)
                    
                    if remainingQATime > 0 && remainingQATime != remainingRoomChangeTime {
                        Text("Time until Q&A")
                            .font(.subheadline)
                        TimerView(endTime: context.state.qaTime)
                            .font(.system(.title, design: .rounded).monospacedDigit())
                            .foregroundColor(.white)
                    } else if remainingRoomChangeTime > 0 {
                        Text("Time until Room Change")
                            .font(.subheadline)
                        TimerView(endTime: context.state.roomChangeTime)
                            .font(.system(.title, design: .rounded).monospacedDigit())
                            .foregroundColor(.white)
                    } else {
                        Text("Time for next talk")
                            .font(.subheadline)
                    }
                    
                    if let nextTalk = context.state.nextTalk {
                        Text("Next: \(nextTalk)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .frame(maxWidth: .infinity)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading) {
                        Text(context.attributes.customString)
                            .font(.headline)
                        let currentTime = Date()
                        let remainingQATime = context.state.qaTime.timeIntervalSince(currentTime)
                        let remainingRoomChangeTime = context.state.roomChangeTime.timeIntervalSince(currentTime)
                        
                        if remainingQATime > 0 && remainingQATime != remainingRoomChangeTime {
                            Text("Time until Q&A")
                                .font(.subheadline)
                        } else if remainingRoomChangeTime > 0 {
                            Text("Time until Room Change")
                                .font(.subheadline)
                        } else {
                            Text("Time for next talk")
                                .font(.subheadline)
                        }
                        if let nextTalk = context.state.nextTalk {
                            Text("Next: \(nextTalk)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    let currentTime = Date()
                    let remainingQATime = context.state.qaTime.timeIntervalSince(currentTime)
                    let remainingRoomChangeTime = context.state.roomChangeTime.timeIntervalSince(currentTime)
                    
                    if remainingQATime > 0 && remainingQATime != remainingRoomChangeTime {
                        TimerView(endTime: context.state.qaTime)
                            .font(.system(.title3, design: .rounded).monospacedDigit())
                    } else if remainingRoomChangeTime > 0 {
                        TimerView(endTime: context.state.roomChangeTime)
                            .font(.system(.title3, design: .rounded).monospacedDigit())
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Tap for details")
                        .font(.caption)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            } compactLeading: {
                let currentTime = Date()
                let remainingQATime = context.state.qaTime.timeIntervalSince(currentTime)
                let remainingRoomChangeTime = context.state.roomChangeTime.timeIntervalSince(currentTime)
                
                if remainingQATime > 0 && remainingQATime != remainingRoomChangeTime {
                    Text("Q&A")
                        .font(.headline)
                } else if remainingRoomChangeTime > 0 {
                    Text("Room")
                        .font(.headline)
                } else {
                    Text("Next")
                        .font(.headline)
                }
            } compactTrailing: {
                let currentTime = Date()
                let remainingQATime = context.state.qaTime.timeIntervalSince(currentTime)
                let remainingRoomChangeTime = context.state.roomChangeTime.timeIntervalSince(currentTime)
                
                if remainingQATime > 0 && remainingQATime != remainingRoomChangeTime {
                    TimerView(endTime: context.state.qaTime, showLabels: false)
                        .font(.caption2.monospacedDigit())
                } else if remainingRoomChangeTime > 0 {
                    TimerView(endTime: context.state.roomChangeTime, showLabels: false)
                        .font(.caption2.monospacedDigit())
                }
            } minimal: {
                let currentTime = Date()
                let remainingQATime = context.state.qaTime.timeIntervalSince(currentTime)
                let remainingRoomChangeTime = context.state.roomChangeTime.timeIntervalSince(currentTime)
                
                if remainingQATime > 0 && remainingQATime != remainingRoomChangeTime {
                    Text(timerInterval: Date()...context.state.qaTime, showsHours: true)
                        .font(.caption2.monospacedDigit())
                        .frame(width: 40)
                } else if remainingRoomChangeTime > 0 {
                    Text(timerInterval: Date()...context.state.roomChangeTime, showsHours: true)
                        .font(.caption2.monospacedDigit())
                        .frame(width: 40)
                }
            }
        }
    }
}

// Custom timer view component
struct TimerView: View {
    let endTime: Date
    var showLabels: Bool = true
    
    var body: some View {
        HStack(spacing: 4) {
            if showLabels {
                VStack {
                    Text(timerInterval: Date()...endTime, countsDown: true, showsHours: true)
                        .multilineTextAlignment(.center)
                        .monospacedDigit()
                        .foregroundStyle(.cyan)
                    
                    Text("remaining")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            } else {
                Text(timerInterval: Date()...endTime, countsDown: true, showsHours: true)
                    .multilineTextAlignment(.center)
                    .monospacedDigit()
            }
        }
    }
}

#Preview(
    "Lockscreen View",
    as: .content,
    using: MyLiveActivityAttributes(customString: "Session 101", customNumber: 1)
) {
    WidgetLiveActivity()
} contentStates: {
    // Preview with Q&A in 10 minutes
    MyLiveActivityAttributes.MyLiveActivityState(
        endTime: Date().addingTimeInterval(10 * 60),
        eventName: "Q&A",
        qaTime: Date().addingTimeInterval(10 * 60),
        roomChangeTime: Date().addingTimeInterval(30 * 60),
        nextTalk: "Session 102: Advanced SwiftUI"
    )
    
    // Preview with room change in 5 minutes
    MyLiveActivityAttributes.MyLiveActivityState(
        endTime: Date().addingTimeInterval(5 * 60),
        eventName: "Room Change",
        qaTime: Date(),
        roomChangeTime: Date().addingTimeInterval(5 * 60),
        nextTalk: "Session 102: Advanced SwiftUI"
    )
    
    // Preview with no time left
    MyLiveActivityAttributes.MyLiveActivityState(
        endTime: Date(),
        eventName: "Next Talk",
        qaTime: Date(),
        roomChangeTime: Date(),
        nextTalk: "Session 102: Advanced SwiftUI"
    )
}
