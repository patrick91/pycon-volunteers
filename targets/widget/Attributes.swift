  //
  //  Attributes.swift
  //  pyconvolunteers
  //
  //  Created by Patrick Arminio on 06/04/2025.
  //

  import ActivityKit
  import SwiftUI

  public struct MyLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable & Hashable {
        var endTime: Date
        var sessionTitle: String
        var qaTime: Date
        var roomChangeTime: Date
        var nextTalk: String?
    }

    public typealias MyLiveActivityState = ContentState
  }
