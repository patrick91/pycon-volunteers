import ActivityKit
import SwiftUI
import WidgetKit
import os

private let log = Logger(
    subsystem: "com.pycon.volunteers",
    category: "WidgetLiveActivity"
)

struct WidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MyLiveActivityAttributes.self) { context in
            let currentTime = Date()
            let timeUntilRoomChange = context.state.roomChangeTime
                .timeIntervalSince(currentTime)
            let timeUntilQA = context.state.qaTime
                .timeIntervalSince(currentTime)

            let hasQa = timeUntilRoomChange != timeUntilQA && timeUntilQA > 0

            let endTime =
                hasQa ? context.state.qaTime : context.state.roomChangeTime

            let text =
                hasQa ? "Time until Q&aaaaaaaaaA" : "Time until Room Change"

            VStack(spacing: 0) {
                if timeUntilRoomChange > 0 {
                    HStack(alignment: .top, spacing: 4) {
                        // Title with flexible width
                        Text(context.state.sessionTitle)
                            .font(.largeTitle)
                            .fontWeight(.semibold)
                            .lineLimit(4)
                            .minimumScaleFactor(0.7)
                            .layoutPriority(1)
                            .foregroundColor(.black)

                        Spacer()

                        // Timer section with fixed size
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(text)
                                .font(.subheadline)
                                .foregroundColor(.black)

                            Text(
                                timerInterval: Date()...endTime,
                                countsDown: true,
                                showsHours: true
                            )
                            .monospacedDigit()
                            .multilineTextAlignment(.trailing)
                            .font(.system(size: 36, weight: .semibold))
                            .foregroundColor(.black)
                        }.frame(minWidth: 110)
                    }.padding().background(
                        Color(
                            #colorLiteral(
                                red: 0.988,
                                green: 0.91,
                                blue: 0.871,
                                alpha: 1
                            )
                        )
                    )

                } else {
                    Text("Time for the next talk! 🔥")
                        .font(.subheadline)
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            Color(
                                #colorLiteral(
                                    red: 0.988,
                                    green: 0.91,
                                    blue: 0.871,
                                    alpha: 1
                                )
                            )
                        )

                }

                if let nextTalk = context.state.nextTalk {
                    Text("Next: \(nextTalk)")
                        .font(.subheadline)
                        .foregroundColor(
                            Color(
                                #colorLiteral(
                                    red: 0.184,
                                    green: 0.184,
                                    blue: 0.184,
                                    alpha: 1
                                )
                            )
                        )
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)  // Add alignment: .leading here
                        .padding()
                }
            }
            .activityBackgroundTint(
                Color(
                    #colorLiteral(
                        red: 0.918,
                        green: 0.839,
                        blue: 0.808,
                        alpha: 1
                    )
                )
            )
            .contentMargins(0)
            .frame(maxWidth: .infinity)

        } dynamicIsland: { context in
            // Log Dynamic Island updates
            let _ = log.debug("Updating Dynamic Island UI")

            // Calculate time intervals once for reuse
            let currentTime = Date()
            let remainingQATime = context.state.qaTime.timeIntervalSince(
                currentTime
            )
            let remainingRoomChangeTime = context.state.roomChangeTime
                .timeIntervalSince(currentTime)

            // Determine which phase we're in
            let hasQA =
                remainingQATime > 0
                && remainingQATime != remainingRoomChangeTime
            let hasRoomChange = remainingRoomChangeTime > 0

            let endTime =
                hasQA ? context.state.qaTime : context.state.roomChangeTime

            return DynamicIsland {

                DynamicIslandExpandedRegion(.leading, priority: 1) {

                    Text("Patrick Arminio, and maybe someone else")
                        .font(.caption)
                        .lineLimit(1)
                        .fontWeight(.semibold)
                        .padding(.leading, 8)

                    Text(context.state.sessionTitle)
                        .multilineTextAlignment(.leading)
                        .fontWeight(.semibold)
                        .dynamicIsland(verticalPlacement: .belowIfTooWide)
                        .padding(.leading, 8)

                }

                DynamicIslandExpandedRegion(.trailing) {
                    if hasQA || hasRoomChange {
                        VStack(alignment: .trailing) {
                            Text(
                                timerInterval: Date()...endTime,
                                countsDown: true,
                                showsHours: true
                            )
                            .monospacedDigit()
                            .multilineTextAlignment(.trailing)
                            if hasQA {
                                Text("To Q&A")
                                    .font(.system(size: 10))
                            } else if hasRoomChange {
                                Text("To Room Change")
                                    .font(.system(size: 10))
                            }
                        }.frame(minWidth: 100)
                            .padding(.trailing, 8)
                    }
                }

            } compactLeading: {
                Image(systemName: "megaphone.fill")
                    .font(.body)
                    .foregroundColor(.white)
            } compactTrailing: {
                if hasQA || hasRoomChange {
                    Text(
                        timerInterval: Date()...endTime,
                        countsDown: true,
                        showsHours: false
                    )
                    .monospacedDigit()
                    .font(.footnote.bold())
                    .foregroundColor(.white)
                    .frame(width: 40)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .frame(width: 20)

                }
            } minimal: {
                if hasQA || hasRoomChange {
                    let startTime = Date()  // Current time
                    let endTime =
                        hasQA
                        ? context.state.qaTime : context.state.roomChangeTime

                    ProgressView(
                        timerInterval: startTime...endTime,
                        label: { EmptyView() },
                        currentValueLabel: { EmptyView() }
                    )
                    .progressViewStyle(.circular)
                    .tint(.white)
                    .frame(width: 36)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.green)
                }
            }
        }
        .contentMarginsDisabled()

    }
}

#Preview(
    "Lockscreen View",
    as: .content,
    using: MyLiveActivityAttributes()
) {
    WidgetLiveActivity()
} contentStates: {
    // Preview with Q&A in 10 minutes
    MyLiveActivityAttributes.MyLiveActivityState(
        endTime: Date().addingTimeInterval(10 * 60),
        sessionTitle: "Session 101: SwiftUI Basics With a very long text",
        qaTime: Date().addingTimeInterval(10 * 60),
        roomChangeTime: Date().addingTimeInterval(30 * 60),
        nextTalk: "Session 102: Advanced SwiftUI also with a very long text :)"
    )

    // Preview with room change in 5 minutes
    MyLiveActivityAttributes.MyLiveActivityState(
        endTime: Date().addingTimeInterval(5 * 60),
        sessionTitle: "Session 101: SwiftUI Basics",
        qaTime: Date(),
        roomChangeTime: Date().addingTimeInterval(5 * 60),
        nextTalk: "Session 102: Advanced SwiftUI"
    )

    MyLiveActivityAttributes.MyLiveActivityState(
        endTime: Date().addingTimeInterval(-10),
        sessionTitle: "Session 101: SwiftUI Basics",
        qaTime: Date().addingTimeInterval(-15),
        roomChangeTime: Date().addingTimeInterval(-5),
        nextTalk: "Session 102: Advanced SwiftUI"
    )
}
