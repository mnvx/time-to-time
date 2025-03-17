# Time to Time Converter

A simple web application for converting between Unix timestamps and human-readable date-time formats.

## About

This project created using [claude](https://www.anthropic.com/) and a little bit modified after.

The initial prompt:

> Create a new app for converting timestamps to date-time and date-time to timestamps. App must contain only html page with all logic based on js. The page must
> have 2 fields: integer field with timestamp (UTC) and string field with date-time. Date-time must be in browser's timezone by defaults if not specified others.
> Near date-time field must be a separate field with select for choosing a timezone of date-time field. When user enter timestamp, then field date-time must be
> calculated. When user enter date-time (and maybe timezone), then field timestamp must be calculated. Date-time field must be by default in ISO format 2026-12-30
> 12:30:25, but user can copy-paste value into this field in another format, therefore we must automatically detect used format and convert it into ISO. Page must
> looks good, use some modern css library for this. Also use some package for converting date and time.

## Features

- Convert Unix timestamps (in seconds) to date-time format
- Convert date-time format to Unix timestamps
- Automatic detection of various date-time formats
- Timezone selection
- Responsive design
- "Use Current Time" button for quick testing

## Technologies Used

- HTML5, CSS3, JavaScript
- [Bootstrap 5](https://getbootstrap.com/) for styling
- [Day.js](https://day.js.org/) for date manipulation

## Usage

Simply open `index.html` in any modern web browser. No server or installation required.

### Converting Timestamp to Date-Time

1. Enter a Unix timestamp in seconds in the "Unix Timestamp" field
2. The corresponding date and time will appear in the Date-Time field
3. Optionally change the timezone to see the date-time in different timezones

### Converting Date-Time to Timestamp

1. Enter a date and time in the "Date and Time" field
2. The app supports various formats and will auto-detect most common ones
3. Select the appropriate timezone for your input
4. The corresponding Unix timestamp will appear in the Timestamp field

## License

MIT