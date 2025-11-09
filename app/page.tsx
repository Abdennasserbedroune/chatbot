export default function ChatPage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Chat App</h2>
        </div>
        <nav className="space-y-2">
          <div className="p-2 rounded bg-muted text-muted-foreground">
            New Chat
          </div>
        </nav>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card p-4">
          <h1 className="text-xl font-semibold text-foreground">Chat Interface</h1>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              U
            </div>
            <div className="flex-1">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-foreground">Hello! This is a placeholder chat interface.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm">
              AI
            </div>
            <div className="flex-1">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-foreground">Welcome to the chat application! This is a basic layout shell.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
