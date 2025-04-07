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
                
                Text("Time until \(context.state.eventName)")
                    .font(.subheadline)
                
                TimerView(endTime: context.state.endTime)
                    .font(.system(.title, design: .rounded).monospacedDigit())
                    .foregroundColor(.white)
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
                        Text("Time until \(context.state.eventName)")
                            .font(.subheadline)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    TimerView(endTime: context.state.endTime)
                        .font(.system(.title3, design: .rounded).monospacedDigit())
                }
                DynamicIslandExpandedRegion(.bottom) {
                    // Additional information can go here
                    Text("Tap when ready")
                        .font(.caption)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            } compactLeading: {
                Text(context.state.eventName.prefix(1))
                    .font(.headline)
            } compactTrailing: {
                TimerView(endTime: context.state.endTime, showLabels: false)
                    .font(.caption2.monospacedDigit())
            } minimal: {
                Text(timerInterval: Date()...context.state.endTime, showsHours: true)
                    .font(.caption2.monospacedDigit())
                    .frame(width: 40)
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
    // Preview with 30 minutes remaining
    MyLiveActivityAttributes.MyLiveActivityState(
        endTime: Date().addingTimeInterval(30 * 60),
        eventName: "Q&A"
    )
}
