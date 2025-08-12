# External Consent Wizard

A powerful, interactive web application for configuring and generating consent dialogs using the Bright SDK External Consent library. This wizard provides a visual interface to customize consent dialogs with real-time preview and generates ready-to-use implementation code.

## 🚀 Features

### Visual Configuration
- **Real-time Preview**: See your consent dialog changes instantly
- **Intuitive Interface**: Easy-to-use form controls for all customization options
- **Multi-language Support**: 13 supported languages with native script display
- **Color Customization**: Visual color pickers for complete design control

### Supported Languages
- 🇺🇸 English
- 🇸🇦 العربية (Arabic)
- 🇩🇪 Deutsch (German)
- 🇪🇸 Español (Spanish)
- 🇫🇷 Français (French)
- 🇮🇳 हिन्दी (Hindi)
- 🇮🇹 Italiano (Italian)
- 🇯🇵 日本語 (Japanese)
- 🇳🇱 Nederlands (Dutch)
- 🇵🇹 Português (Portuguese)
- 🇷🇺 Русский (Russian)
- 🇹🇷 Türkçe (Turkish)
- 🇨🇳 中文 (Chinese Simplified)

### Configuration Options
- **Visual Elements**: Logo, QR code, custom button images
- **Text Content**: Title, benefit text, button labels
- **Design System**: Background, accent, text, border, and outline colors
- **Internationalization**: Full language support with proper locale handling

### Developer Features
- **Code Generation**: Automatic implementation code generation
- **URL Sharing**: Share configurations via encoded URLs
- **Copy to Clipboard**: Easy copying of generated code snippets
- **Download Instructions**: Step-by-step implementation guide

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19 with Material-UI 6
- **Build System**: Webpack 5 with code splitting optimization
- **Styling**: Emotion-based styling with Roboto font
- **Development**: Hot reload with webpack-dev-server

### Performance Optimizations
- **Code Splitting**: Automatic vendor, React, and MUI chunk separation
- **Lazy Loading**: Components load on-demand with React.lazy()
- **Bundle Optimization**: Optimized chunk sizes and caching strategies
- **Asset Management**: Efficient handling of fonts and images

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd external-consent-wizard

# Install dependencies
npm install

# Start development server
npm start
```

The application will open automatically at `http://localhost:8080` (or next available port).

### Building for Production
```bash
# Build optimized production bundle
npm run build

# The built application will be available in the dist/ folder
# This contains the complete, optimized application ready for deployment
```

### Deployment
The `dist/` folder contains the production-ready application that can be:
- Deployed to any static hosting service (GitHub Pages, Netlify, Vercel, etc.)
- Served from any web server
- Used as a standalone application

```bash
# Serve the production application locally
npm run serve
# or
cd dist && npx serve -s .
```

## 📖 Usage Guide

### Basic Configuration
1. **Language Selection**: Choose your target language from the dropdown
2. **Visual Assets**: Configure logo and QR code URLs
3. **Text Content**: Customize title and benefit text
4. **Button Configuration**: Set button texts and optional custom images
5. **Color Scheme**: Use color pickers to match your brand

### Advanced Features
- **Real-time Preview**: Changes are reflected immediately in the preview panel
- **URL Sharing**: Use the share button to generate shareable configuration URLs
- **Implementation Guide**: Click "How to implement" for step-by-step integration instructions
- **Code Generation**: Get ready-to-use JavaScript code for your configuration

### Implementation Steps
1. **Download Script**: Use the provided curl command to download the consent library
2. **Add HTML Structure**: Include the required HTML container and styles
3. **Include Script**: Add the consent script to your page
4. **Initialize Dialog**: Use the generated configuration code
5. **Handle Callbacks**: Implement onShow, onAccept, onDecline, and onClose handlers

## 🔧 Configuration Reference

### Basic Properties
```javascript
{
  logo: "img/logo.png",           // URL to your logo image
  qrCode: "img/qr.png",          // URL to QR code image (optional)
  title: "Consent Title",         // Main dialog title
  benefitText: "Support text",    // Explanatory text
  acceptButtonText: "Accept",     // Accept button label
  declineButtonText: "Decline",   // Decline button label
  language: "en-US"               // Interface language
}
```

### Visual Customization
```javascript
{
  backgroundColor: "#FBEFCF",     // Dialog background color
  accentColor: "#D36B2E",         // Primary accent color
  acceptTextColor: "#FFF",        // Accept button text color
  declineTextColor: "#9D9B9B",    // Decline button text color
  borderColor: "#AA99EC",         // Dialog border color
  outlineColor: "#9DA9E8"         // Outline accent color
}
```

### Advanced Options
```javascript
{
  acceptButton: "img/accept.png", // Custom accept button image
  declineButton: "img/decline.png", // Custom decline button image
  preview: false,                 // Enable preview mode
  onShow: () => {},              // Show callback
  onAccept: () => {},            // Accept callback
  onDecline: () => {},           // Decline callback
  onClose: () => {}              // Close callback
}
```

## 🚀 Deployment

### Production Application
The application is built and ready for deployment in the `dist/` folder. This contains:
- Optimized JavaScript bundles with code splitting
- Compressed assets and fonts
- Production-ready HTML with proper meta tags
- All static resources (images, styles)

### Hosting Options
Deploy the `dist/` folder to any of these platforms:
- **GitHub Pages**: Upload dist contents to gh-pages branch
- **Netlify**: Drag and drop the dist folder or connect repository
- **Vercel**: Import project and build automatically
- **AWS S3**: Upload dist contents to S3 bucket with static hosting
- **Any Web Server**: Copy dist contents to web server directory

### Custom Domain
The application works with any domain. Simply:
1. Build the application: `npm run build`
2. Upload the `dist/` folder contents to your hosting
3. Point your domain to the hosting location

## 🌐 Live Application

**Production Deployment**: [Launch External Consent Wizard](./dist/index.html)

Access the fully-featured production application with all configuration options, real-time preview, and code generation capabilities. This is the complete tool ready for use in configuring consent dialogs.

## 🔗 Related Projects

- **[Bright SDK External Consent](https://github.com/BrightSDK/bright-sdk-external-consent)**: The core consent library
- **[Bright SDK](https://brightsdk.com)**: Complete SDK ecosystem

## 📁 Project Structure

```
external-consent-wizard/
├── public/
│   ├── index.html              # Base HTML template
│   └── img/                    # Static images
├── src/
│   ├── App.jsx                 # Main application component
│   ├── index.js               # Application entry point
│   └── components/
│       ├── ConsentConfigurator.jsx  # Main configuration interface
│       └── ImplementationSteps.jsx  # Implementation guide dialog
├── dist/                       # Production build output
├── webpack.config.js          # Webpack configuration
└── package.json               # Project dependencies and scripts
```

## 🛠️ Development

### Code Structure
- **ConsentConfigurator**: Main component handling configuration and preview
- **ImplementationSteps**: Modal dialog with implementation instructions
- **Language Support**: Complete mapping between UI locales and consent library codes

### Key Features Implementation
- **Real-time Preview**: useEffect hook with debounced updates
- **State Management**: React hooks with URL persistence
- **Language Conversion**: Mapping between locale formats (en_US ↔ en-US)
- **Code Generation**: Dynamic JavaScript code construction

### Performance Considerations
- **Bundle Splitting**: Vendor libraries separated for optimal caching
- **Lazy Loading**: Implementation guide loads on-demand
- **Memory Management**: Proper cleanup of timeouts and event listeners

## 📄 License

ISC License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues:
- Create an issue in the repository
- Check the [Bright SDK documentation](https://brightsdk.com/docs)
- Review the implementation guide in the application

---

**Built with ❤️ by the Bright SDK Team**
