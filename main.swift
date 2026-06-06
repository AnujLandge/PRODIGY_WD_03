import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Set window dimensions
        let windowWidth: CGFloat = 460
        let windowHeight: CGFloat = 720
        
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1024, height: 768)
        let rect = NSRect(
            x: screenRect.origin.x + (screenRect.width - windowWidth) / 2,
            y: screenRect.origin.y + (screenRect.height - windowHeight) / 2,
            width: windowWidth,
            height: windowHeight
        )
        
        // Initialize Cocoa window
        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Celestial Tic-Tac-Toe"
        window.center()
        
        // Configure WKWebView
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled") // Enable Web Inspector (DevTools)
        
        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        
        window.contentView?.addSubview(webView)
        window.makeKeyAndOrderFront(nil)
        
        // Load index.html from Bundle Resources
        guard let resourcesURL = Bundle.main.resourceURL else {
            print("Error: Could not retrieve Bundle Resource URL")
            NSApp.terminate(nil)
            return
        }
        
        let htmlURL = resourcesURL.appendingPathComponent("index.html")
        if FileManager.default.fileExists(atPath: htmlURL.path) {
            webView.loadFileURL(htmlURL, allowingReadAccessTo: resourcesURL)
        } else {
            // Local fallback for quick development execution
            let currentDir = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
            let localHtml = currentDir.appendingPathComponent("index.html")
            webView.loadFileURL(localHtml, allowingReadAccessTo: currentDir)
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// Generate basic native application menus (Quit shortcut Command+Q)
func setupAppMenu() {
    let mainMenu = NSMenu()
    
    let appMenuItem = NSMenuItem()
    mainMenu.addItem(appMenuItem)
    
    let appMenu = NSMenu()
    let appName = "Celestial Tic-Tac-Toe"
    
    let quitTitle = "Quit \(appName)"
    let quitMenuItem = NSMenuItem(title: quitTitle, action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
    appMenu.addItem(quitMenuItem)
    appMenuItem.submenu = appMenu
    
    NSApp.mainMenu = mainMenu
}

// Bootstrap application lifecycle
let app = NSApplication.shared
setupAppMenu()
let delegate = AppDelegate()
app.delegate = delegate
app.run()
