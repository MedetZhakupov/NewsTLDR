import SwiftUI

struct NewsletterDetailView: View {
    let tldr: TLDRSummary

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text(tldr.subject)
                        .font(.title2.bold())

                    HStack {
                        Label(tldr.senderName, systemImage: "person.circle")
                            .font(.subheadline)
                            .foregroundStyle(.blue)

                        Spacer()

                        Text(tldr.receivedDate, style: .date)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Text(tldr.senderEmail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Divider()

                // TLDR
                VStack(alignment: .leading, spacing: 8) {
                    Label("TLDR", systemImage: "sparkles")
                        .font(.headline)

                    Text(tldr.tldr)
                        .font(.body)
                        .lineSpacing(4)
                }
                .padding()
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // Meta
                VStack(alignment: .leading, spacing: 4) {
                    Label("Summarized \(tldr.summarizedDate, style: .relative) ago", systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
            .padding()
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}
