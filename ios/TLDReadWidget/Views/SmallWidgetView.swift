import SwiftUI
import WidgetKit

struct SmallWidgetView: View {
    let entry: TLDREntry

    var body: some View {
        if let tldr = entry.tldrs.first {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: "sparkles")
                        .font(.caption2)
                        .foregroundStyle(.blue)
                    Text(tldr.senderName)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.blue)
                        .lineLimit(1)
                }

                Text(tldr.subject)
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(2)

                Text(tldr.tldr)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
            .widgetURL(URL(string: "tldread://tldr/\(tldr.messageId)"))
        } else {
            VStack(spacing: 8) {
                Image(systemName: "doc.text.magnifyingglass")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                Text("No summaries yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
