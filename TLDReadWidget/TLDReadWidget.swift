import SwiftUI
import WidgetKit

struct TLDReadWidget: Widget {
    let kind: String = "TLDReadWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TLDRTimelineProvider()) { entry in
            TLDReadWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Newsletter TLDRs")
        .description("AI-powered summaries of your Gmail newsletters.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct TLDReadWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: TLDREntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            MediumWidgetView(entry: entry)
        }
    }
}

#Preview(as: .systemSmall) {
    TLDReadWidget()
} timeline: {
    TLDREntry.placeholder
}

#Preview(as: .systemMedium) {
    TLDReadWidget()
} timeline: {
    TLDREntry.placeholder
}

#Preview(as: .systemLarge) {
    TLDReadWidget()
} timeline: {
    TLDREntry.placeholder
}
