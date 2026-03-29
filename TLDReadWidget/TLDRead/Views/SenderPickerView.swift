import SwiftUI

struct SenderPickerView: View {
    @Bindable var viewModel: SenderViewModel

    var body: some View {
        List {
            if viewModel.isLoading {
                Section {
                    HStack {
                        ProgressView()
                        Text("Discovering newsletter senders...")
                            .foregroundStyle(.secondary)
                            .padding(.leading, 8)
                    }
                }
            }

            if let error = viewModel.errorMessage {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.red)
                        .font(.caption)
                }
            }

            if !viewModel.trackedSenders.isEmpty {
                Section("Tracked") {
                    ForEach(viewModel.trackedSenders) { sender in
                        SenderRow(sender: sender) {
                            viewModel.toggleSender(sender)
                        }
                    }
                }
            }

            Section("All Senders") {
                ForEach(viewModel.filteredSenders) { sender in
                    if !sender.isTracked {
                        SenderRow(sender: sender) {
                            viewModel.toggleSender(sender)
                        }
                    }
                }
            }
        }
        .searchable(text: $viewModel.searchText, prompt: "Search senders")
        .navigationTitle("Newsletter Senders")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await viewModel.loadSenders() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(viewModel.isLoading)
            }
        }
        .task {
            if viewModel.discoveredSenders.isEmpty {
                await viewModel.loadSenders()
            }
        }
    }
}

private struct SenderRow: View {
    let sender: TrackedSender
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(sender.name)
                        .font(.body)
                        .foregroundStyle(.primary)
                    Text(sender.email)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: sender.isTracked ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(sender.isTracked ? .blue : .secondary)
                    .font(.title3)
            }
        }
    }
}
