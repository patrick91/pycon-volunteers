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
      var eventName: String
  }

  public typealias MyLiveActivityState = ContentState

  var customString: String
  var customNumber: Int
}
