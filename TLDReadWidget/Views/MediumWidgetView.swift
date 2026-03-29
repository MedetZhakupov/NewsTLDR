import SwiftUI
import WidgetKit

struct MediumWidgetView: View {
    let entry: TLDREntry

    var body: some View {
        if entry.tldrs.isEmpty {
            emptyState
        } else {
            VStack(alignment: .leading, spacing: 8) {
                ForEach(entry.tldrs.prefix(3)) { tldr in
                    Link(destination: URL(string: "tldread://tldr/\(tldr.messageId)")!) {
                        HStack(alignment: .top, spacing: 8) {
                            Circle()
                                .fill(.blue)
                                .frame(width: 6, height: 6)
                                .padding(.top, 5)

                            VStack(alignment: .leading, spacing: 1) {
                                HStack {
                                    Text(tldr.senderName)
                                        .font(.caption2)
                                        .fontWeight(.semibold)
                                        .foregroundStyle(.blue)
                                    Spacer()
                                    Text(tldr.receivedDate, style: .relative)
                                        .font(.system(size: 9))
                                        .foregroundStyle(.tertiary)
                                }

                                Text(tldr.tldr)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                            }
                        }
                    }

                    if tldr.id != entry.tldrs.prefix(3).last?.id {
                        Divider()
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        HStack {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "doc.text.magnifyingglass")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                Text("No newsletter summaries yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("Open TLDRead to get started")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            Spacer()
        }
    }
}
