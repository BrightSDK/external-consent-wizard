# 🧙‍♂️ External Consent Wizard

A beautiful, modern React application for configuring and previewing Bright SDK consent dialogs with real-time customization and glassmorphism design.

![External Consent Wizard](https://img.shields.io/badge/React-19-blue.svg)
![Material-UI](https://img.shields.io/badge/Material--UI-6-blue.svg)
![Webpack](https://img.shields.io/badge/Webpack-5-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## ✨ Features

### 🎨 Modern Design
- **Glassmorphism UI**: Beautiful glass-like cards with blur effects
- **Blue Gradient Background**: Stunning gradient from purple-blue to violet
- **Responsive Layout**: Optimized for different screen sizes
- **Professional Typography**: Bold titles with meaningful glyphs

### ⚙️ Configuration Options
- **Visual Customization**: Logo, QR code, and button images
- **Text Customization**: Title, benefit text, and button labels
- **Color Palette**: Background, accent, text, border, and outline colors
- **Real-time Preview**: See changes instantly as you type

### 🔧 Advanced Features
- **URL Sharing**: Share configurations via encoded URLs
- **Implementation Guide**: Step-by-step integration instructions
- **Focus Retention**: Smooth UX during real-time updates
- **Clipboard Integration**: One-click URL copying

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with ES6+ support

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd external-consent-wizard

# Install dependencies
npm install

# Start development server
npm start
```

The application will open at `http://localhost:8081`

### Build for Production

```bash
# Create production build
npm run build

# Serve built files
npm run serve
```

## 📖 Usage Guide

### 1. Configuration Panel ⚙️
The left panel provides comprehensive customization options:

#### Visual Elements
- **Logo URL**: Path to your application logo
- **QR Code URL**: Optional QR code for mobile scanning
- **Accept/Decline Button Images**: Custom button graphics

#### Text Content
- **Title**: Main consent dialog heading
- **Benefit Text**: Explanation of consent benefits
- **Button Text**: Custom labels for accept/decline actions

#### Color Scheme
- **Background Color**: Dialog background
- **Accent Color**: Primary brand color
- **Text Colors**: Accept and decline button text
- **Border & Outline**: Custom border styling

### 2. Preview Panel 👁️
The right panel shows real-time preview:
- **Live Updates**: Changes reflect immediately
- **Centered Display**: Optimal preview positioning
- **Interactive Elements**: Functional buttons and layout

### 3. Action Buttons
- **Reset**: Restore default configuration
- **View Implementation Steps**: Detailed integration guide
- **Share**: Generate shareable configuration URL

## 🔗 URL Sharing

The wizard supports sharing configurations through encoded URLs:

```
https://your-domain.com/#[base64-encoded-config]
```

### Example Workflow
1. Configure your consent dialog
2. Click "Share" button
3. URL is automatically copied to clipboard
4. Share with team members or save for later

## 🛠️ Technical Architecture

### Core Technologies
- **React 19**: Modern React with hooks and functional components
- **Material-UI 6**: Comprehensive component library
- **Webpack 5**: Module bundling and development server
- **Babel**: JavaScript transpilation for browser compatibility

### Key Components

#### `ConsentConfigurator.jsx`
Main application component featuring:
- State management for configuration options
- Real-time preview updates with debouncing
- URL encoding/decoding for sharing
- Focus retention during updates

#### `ImplementationSteps.jsx`
Modal dialog providing:
- Step-by-step integration instructions
- Code examples for different scenarios
- Best practices and tips

### Project Structure
```
external-consent-wizard/
├── public/                 # Static assets
│   ├── img/               # Sample images
│   └── index.html         # HTML template
├── src/                   # Source code
│   ├── components/        # React components
│   ├── index.js          # Application entry point
│   └── App.jsx           # Root component
├── webpack.config.js      # Build configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## 🎯 Integration Guide

### Basic Setup
```javascript
// Include the consent module
import ConsentModule from './bright-sdk-external-consent';

// Create consent dialog
const config = {
  logo: "img/logo.png",
  title: "Bright SDK Consent",
  benefitText: "To support the app",
  acceptButtonText: "Accept",
  declineButtonText: "Decline",
  // ... other options
};

ConsentModule.create("container-id", config).show();
```

### Advanced Configuration
```javascript
const advancedConfig = {
  // Visual elements
  logo: "img/custom-logo.png",
  qrCode: "img/qr-code.png",
  acceptButton: "img/custom-accept.png",
  declineButton: "img/custom-decline.png",

  // Colors
  backgroundColor: "#FBEFCF",
  accentColor: "#D36B2E",
  acceptTextColor: "#FFF",
  declineTextColor: "#9D9B9B",
  borderColor: "#AA99EC",
  outlineColor: "#9DA9E8",

  // Text content
  title: "Custom Consent Title",
  benefitText: "Custom benefit explanation",
  acceptButtonText: "I Agree",
  declineButtonText: "No Thanks"
};
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow React best practices
- Maintain consistent code style
- Add comments for complex logic
- Test changes thoroughly

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Development Server Issues
```bash
# Check if port 8081 is available
lsof -i :8081

# Use different port
npm start -- --port 3000
```

#### React Import Issues
If you encounter "React is not defined" errors:
- Ensure React import is present in JSX files
- Check babel configuration for JSX transform
- Verify webpack setup for React

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Contact the development team
- Check documentation for common solutions

---

**Made with ❤️ by the Bright SDK Team**