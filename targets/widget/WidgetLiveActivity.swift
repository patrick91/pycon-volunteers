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
            
            let endTime = hasQa ? context.state.qaTime : context.state.roomChangeTime
            
            
            let text = hasQa ? "Time until Q&A" : "Time until Room Change"
            
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
                    }.padding()
                    
                } else {
                    Text("Time for the next talk! 🔥")
                        .font(.subheadline)
                        .foregroundColor(.black)
                        .padding()
                }
                
                if let nextTalk = context.state.nextTalk {
                    Text("Next: \(nextTalk)")
                        .font(.subheadline)
                        .foregroundColor(Color(#colorLiteral(red: 0.184, green: 0.184, blue: 0.184, alpha: 1)))
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading) // Add alignment: .leading here
                        .padding()
                        .background(
                            Color(
                                #colorLiteral(
                                    red: 0.918,
                                    green: 0.839,
                                    blue: 0.808,
                                    alpha: 1
                                )
                            )
                        )
                }
            }
            .activityBackgroundTint(
                Color(
                    #colorLiteral(
                        red: 0.988,
                        green: 0.91,
                        blue: 0.871,
                        alpha: 1
                    )
                )
            )
            .contentMargins(0)
            .frame(maxWidth: .infinity)
            
        } dynamicIsland: { context in
            // Log Dynamic Island updates
            let _ = log.debug("Updating Dynamic Island UI")
            
            return DynamicIsland {
                // Expanded UI goes here
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading) {
                        Text(context.state.sessionTitle)
                            .font(.headline)
                            .foregroundColor(.black)
                        let currentTime = Date()
                        let remainingQATime = context.state.qaTime
                            .timeIntervalSince(currentTime)
                        let remainingRoomChangeTime = context.state
                            .roomChangeTime.timeIntervalSince(currentTime)
                        
                        if remainingQATime > 0
                            && remainingQATime != remainingRoomChangeTime
                        {
                            Text("Time until Q&A")
                                .font(.subheadline)
                                .foregroundColor(.black)
                        } else if remainingRoomChangeTime > 0 {
                            Text("Time until Room Change")
                                .font(.subheadline)
                                .foregroundColor(.black)
                        } else {
                            Text("Time for next talk")
                                .font(.subheadline)
                                .foregroundColor(.black)
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
                    let remainingQATime = context.state.qaTime
                        .timeIntervalSince(currentTime)
                    let remainingRoomChangeTime = context.state.roomChangeTime
                        .timeIntervalSince(currentTime)
                    
                    if remainingQATime > 0
                        && remainingQATime != remainingRoomChangeTime
                    {
                        
                    } else if remainingRoomChangeTime > 0 {
                        
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Tap for details")
                        .font(.caption)
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            } compactLeading: {
                let currentTime = Date()
                let remainingQATime = context.state.qaTime.timeIntervalSince(
                    currentTime
                )
                let remainingRoomChangeTime = context.state.roomChangeTime
                    .timeIntervalSince(currentTime)
                
                if remainingQATime > 0
                    && remainingQATime != remainingRoomChangeTime
                {
                    Text("Q&A")
                        .font(.headline)
                        .foregroundColor(.black)
                } else if remainingRoomChangeTime > 0 {
                    Text("Room")
                        .font(.headline)
                        .foregroundColor(.black)
                } else {
                    Text("Next")
                        .font(.headline)
                        .foregroundColor(.black)
                }
            } compactTrailing: {
                let currentTime = Date()
                let remainingQATime = context.state.qaTime.timeIntervalSince(
                    currentTime
                )
                let remainingRoomChangeTime = context.state.roomChangeTime
                    .timeIntervalSince(currentTime)
                
                if remainingQATime > 0
                    && remainingQATime != remainingRoomChangeTime
                {
                    
                } else if remainingRoomChangeTime > 0 {
                    
                }
            } minimal: {
                let currentTime = Date()
                let remainingQATime = context.state.qaTime.timeIntervalSince(
                    currentTime
                )
                let remainingRoomChangeTime = context.state.roomChangeTime
                    .timeIntervalSince(currentTime)
                
                if remainingQATime > 0
                    && remainingQATime != remainingRoomChangeTime
                {
                    Text(
                        timerInterval: Date()...context.state.qaTime,
                        showsHours: true
                    )
                    .font(.caption2.monospacedDigit())
                    .foregroundColor(.black)
                    .frame(width: 40)
                } else if remainingRoomChangeTime > 0 {
                    Text(
                        timerInterval: Date()...context.state.roomChangeTime,
                        showsHours: true
                    )
                    .font(.caption2.monospacedDigit())
                    .foregroundColor(.black)
                    .frame(width: 40)
                }
            }
        }.contentMarginsDisabled()
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
        sessionTitle: "Session 101: SwiftUI Basics Patrick",
        qaTime: Date().addingTimeInterval(10 * 60),
        roomChangeTime: Date().addingTimeInterval(30 * 60),
        nextTalk: "Session 102: Advanced SwiftUI"
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
        endTime: Date(),
        sessionTitle: "Session 101: SwiftUI Basics",
        qaTime: Date(),
        roomChangeTime: Date(),
        nextTalk: "Session 102: Advanced SwiftUI"
    )
}
