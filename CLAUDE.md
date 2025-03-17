# Time to Time Converter - Development Guide

## Running the Project
- Open `index.html` in any modern web browser (no build required)

## Code Style Guidelines

### JavaScript
- **Naming**: camelCase for variables/functions, UPPERCASE_SNAKE_CASE for constants
- **Organization**: Group related functionality into separate functions
- **Error Handling**: Use try/catch blocks for robust error handling
- **Comments**: Use descriptive comments for complex logic
- **Event Handling**: Use addEventListener for DOM events
- **Format Detection**: Support multiple date formats with auto-detection

### HTML/CSS
- **Framework**: Bootstrap 5 for components and layout
- **Responsive**: Mobile-first design with responsive layout
- **Styling**: Custom styling extends Bootstrap
- **Naming**: Semantic class names following Bootstrap conventions

## Library Usage
- dayjs with plugins (utc, timezone, customParseFormat) for date manipulation
- Bootstrap 5 for UI components and styling

## Project Features
- Convert between Unix timestamps and date-time formats
- Timezone selection with real-time display
- Cursor position handling during date editing
- Support for multiple date formats