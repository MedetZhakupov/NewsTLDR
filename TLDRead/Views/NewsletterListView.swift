import SwiftUI

struct NewsletterListView: View {
    @Bindable var viewModel: NewsletterViewModel
    @State private var searchText = ""
    @State private var tldrToDelete: TLDRSummary?
    @State private var showDeleteConfirmation = false

    private var filteredTLDRs: [TLDRSummary] {
        if searchText.isEmpty { return viewModel.tldrs }
        return viewModel.tldrs.filter {
            $0.senderName.localizedCaseInsensitiveContains(searchText) ||
            $0.subject.localizedCaseInsensitiveContains(searchText) ||
            $0.tldr.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        List {
            if let progress = viewModel.progress {
                Section {
                    HStack(spacing: 12) {
                        ProgressView()
                        Text(progress)
                            .foregroundStyle(.secondary)
                            .font(.subheadline)
                    }
                }
            }

            if let error = viewModel.errorMessage {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.orange)
                        .font(.caption)
                }
            }

            if viewModel.tldrs.isEmpty && !viewModel.isLoading && viewModel.hasLoaded {
                Section {
                    ContentUnavailableView(
                        "No Summaries Yet",
                        systemImage: "doc.text.magnifyingglass",
                        description: Text("Pull to refresh or tap the refresh button to fetch and summarize your newsletters.")
                    )
                }
            } else if !searchText.isEmpty && filteredTLDRs.isEmpty {
                ContentUnavailableView.search(text: searchText)
            }

            Section {
                ForEach(filteredTLDRs) { tldr in
                    NavigationLink(value: tldr) {
                        TLDRRowView(tldr: tldr)
                    }
                }
                .onDelete { indexSet in
                    if let index = indexSet.first {
                        tldrToDelete = filteredTLDRs[index]
                        showDeleteConfirmation = true
                    }
                }
            }
        }
        .searchable(text: $searchText, prompt: "Search summaries")
        .navigationTitle("TLDRead")
        .navigationDestination(for: TLDRSummary.self) { tldr in
            NewsletterDetailView(tldr: tldr)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await viewModel.refreshTLDRs() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(viewModel.isLoading)
            }
        }
        .refreshable {
            await viewModel.refreshTLDRs()
        }
        .safeAreaInset(edge: .bottom) {
            if let date = viewModel.lastRefreshDate {
                Text("Last refreshed \(date, style: .relative) ago")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(.bar)
            }
        }
        .confirmationDialog("Delete this summary?", isPresented: $showDeleteConfirmation, presenting: tldrToDelete) { tldr in
            Button("Delete", role: .destructive) {
                viewModel.deleteTLDR(tldr)
            }
        } message: { tldr in
            Text(tldr.subject)
        }
        .onAppear {
            viewModel.loadCachedTLDRs()
        }
    }
}

private struct TLDRRowView: View {
    let tldr: TLDRSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(tldr.senderName)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.blue)

                Spacer()

                Text(tldr.receivedDate, style: .relative)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Text(tldr.subject)
                .font(.subheadline)
                .fontWeight(.medium)
                .lineLimit(1)

            Text(tldr.tldr)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(3)
        }
        .padding(.vertical, 4)
    }
}
