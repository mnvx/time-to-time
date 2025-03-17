document.addEventListener('DOMContentLoaded', function() {
    // Initialize dayjs plugins
    dayjs.extend(window.dayjs_plugin_utc);
    dayjs.extend(window.dayjs_plugin_timezone);
    dayjs.extend(window.dayjs_plugin_customParseFormat);
    
    // DOM elements
    const timestampInput = document.getElementById('timestamp');
    const datetimeInput = document.getElementById('datetime');
    const timezoneSelect = document.getElementById('timezone');
    const infoBox = document.getElementById('info-box');
    const formatHint = document.getElementById('formatHint');
    
    // Default format
    const ISO_FORMAT = 'YYYY-MM-DD HH:mm:ss';
    
    // Common datetime formats for auto-detection
    const commonFormats = [
        ISO_FORMAT,
        'YYYY/MM/DD HH:mm:ss',
        'MM/DD/YYYY HH:mm:ss',
        'DD/MM/YYYY HH:mm:ss',
        'YYYY-MM-DDTHH:mm:ss.SSSZ',
        'YYYY-MM-DDTHH:mm:ssZ',
        'YYYY-MM-DDTHH:mm:ss',
        'DD-MM-YYYY HH:mm:ss',
        'MM-DD-YYYY HH:mm:ss',
        'MMMM D, YYYY HH:mm:ss',
        'D MMMM YYYY HH:mm:ss',
        'MMM D, YYYY HH:mm:ss',
        'D MMM YYYY HH:mm:ss'
    ];
    
    // Timezone list - populated on load
    const timezones = Intl.supportedValuesOf ? 
        Intl.supportedValuesOf('timeZone') : 
        [
            'UTC',
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'Europe/London',
            'Europe/Berlin',
            'Europe/Moscow',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Australia/Sydney',
            'Pacific/Auckland'
        ];
    
    // Get browser's timezone
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Calculate timezone offset in hours
    function getTimezoneOffset(timezone) {
        const now = new Date();
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const offset = (tzDate - utcDate) / (1000 * 60 * 60);
        return offset;
    }
    
    // Format timezone option text with offset and current time
    function formatTimezoneOption(timezone) {
        const offset = getTimezoneOffset(timezone);
        const sign = offset >= 0 ? '+' : '';
        const offsetText = `${sign}${offset}`;
        
        // Current time in the timezone
        const timeText = new Date().toLocaleTimeString('en-US', { 
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        return { 
            timezone, 
            offsetText, 
            timeText 
        };
    }
    
    // Initialize timezone dropdown
    function initTimezoneDropdown() {
        // Clear any existing options
        timezoneSelect.innerHTML = '';
        
        // Format for display
        const formattedTimezones = timezones.map(timezone => {
            return formatTimezoneOption(timezone);
        });
        
        // Sort by offset
        formattedTimezones.sort((a, b) => {
            const offsetA = parseFloat(a.offsetText);
            const offsetB = parseFloat(b.offsetText);
            return offsetA - offsetB;
        });
        
        // Create and append options
        formattedTimezones.forEach(({ timezone, offsetText, timeText }) => {
            const option = document.createElement('option');
            option.value = timezone;
            
            // Format the option text to include timezone, offset and current time
            const nameParts = timezone.split('/');
            const shortName = nameParts.length > 1 ? nameParts[1].replace(/_/g, ' ') : timezone;
            
            // Use tabs and spaces to create a table-like appearance with consistent columns
            const spacedName = timezone.padEnd(28, ' ');
            option.textContent = `${spacedName}${offsetText.padStart(4, ' ').padEnd(8, ' ')}${timeText}`;
            
            // Store data for updating
            option.dataset.timezone = timezone;
            option.dataset.offset = offsetText;
            option.dataset.time = timeText;
            
            if (timezone === localTimezone) {
                option.selected = true;
            }
            
            timezoneSelect.appendChild(option);
        });
        
        // Apply special styling to show bold and gray text in options
        applySelectStyling();
    }
    
    // Apply CSS styling for select options
    function applySelectStyling() {
        // Add a class to our select for custom styling
        timezoneSelect.classList.add('timezone-select');
        
        // Check if the stylesheet has already been added
        if (!document.getElementById('timezone-option-styles')) {
            // Create a style element for the option styling
            const styleEl = document.createElement('style');
            styleEl.id = 'timezone-option-styles';
            
            // Add CSS rules for styling options
            styleEl.textContent = `
                .timezone-select option {
                    font-family: monospace;
                }
            `;
            
            // Add the style element to the head
            document.head.appendChild(styleEl);
        }
    }
    
    // Update all timezone options with current time
    function updateTimezoneOptions() {
        // Update each option
        Array.from(timezoneSelect.options).forEach(option => {
            const timezone = option.dataset.timezone;
            if (timezone) {
                const { offsetText, timeText } = formatTimezoneOption(timezone);
                
                // Update the data attributes
                option.dataset.offset = offsetText;
                option.dataset.time = timeText;
                
                // Update the option text with consistent spacing
                const spacedName = timezone.padEnd(28, ' ');
                option.textContent = `${spacedName}${offsetText.padStart(4, ' ').padEnd(8, ' ')}${timeText}`;
            }
        });
    }
    
    // Update info box
    function updateInfoBox(message, type = 'info') {
        infoBox.textContent = message;
        infoBox.className = `alert alert-${type}`;
    }
    
    // Convert timestamp to datetime
    function timestampToDatetime(timestamp) {
        if (!timestamp) return;
        
        try {
            const timestampNum = parseInt(timestamp, 10);
            
            if (isNaN(timestampNum)) {
                updateInfoBox('Invalid timestamp format', 'warning');
                return;
            }
            
            const selectedTimezone = timezoneSelect.value;
            const datetime = dayjs.unix(timestampNum).tz(selectedTimezone);
            
            if (!datetime.isValid()) {
                updateInfoBox('Invalid timestamp value', 'warning');
                return;
            }
            
            datetimeInput.value = datetime.format(ISO_FORMAT);
            updateInfoBox(`Converted timestamp ${timestampNum} to datetime in ${selectedTimezone} timezone`, 'success');
        } catch (error) {
            updateInfoBox(`Error: ${error.message}`, 'danger');
        }
    }
    
    // Detect format from input string
    function detectFormat(datetimeStr) {
        for (const format of commonFormats) {
            if (dayjs(datetimeStr, format).isValid()) {
                return format;
            }
        }
        return null;
    }
    
    // Convert datetime to timestamp (used for programmatic updates, not direct user input)
    function datetimeToTimestamp(datetimeStr) {
        if (!datetimeStr) return;
        
        // If the update is user-initiated typing, use our specialized handler
        if (isUpdatingDateTime) {
            calculateTimestampFromDatetime(datetimeStr);
            return;
        }
        
        try {
            const selectedTimezone = timezoneSelect.value;
            let datetime;
            let format;
            
            // Try to auto-detect format
            format = detectFormat(datetimeStr);
            
            if (format) {
                datetime = dayjs.tz(datetimeStr, format, selectedTimezone);
            } else {
                // Try parsing as a native Date
                const nativeDate = new Date(datetimeStr);
                if (!isNaN(nativeDate.getTime())) {
                    datetime = dayjs.tz(nativeDate, selectedTimezone);
                } else {
                    updateInfoBox('Unrecognized date-time format', 'warning');
                    return;
                }
            }
            
            if (!datetime.isValid()) {
                updateInfoBox('Invalid date-time value', 'warning');
                return;
            }
            
            // Convert to Unix timestamp (seconds)
            const timestamp = datetime.unix();
            timestampInput.value = timestamp;
            
            // Only format the datetime input for programmatic changes (not user typing)
            // For example, when changing timezone or clicking the "Use Current Time" button
            if (!isUpdatingDateTime) {
                // Save cursor position
                const cursorPos = datetimeInput.selectionStart;
                
                // Format the datetime input in ISO format
                datetimeInput.value = datetime.format(ISO_FORMAT);
                
                // Try to restore cursor position if appropriate
                if (document.activeElement === datetimeInput) {
                    const newPos = Math.min(cursorPos, datetimeInput.value.length);
                    datetimeInput.setSelectionRange(newPos, newPos);
                }
            }
            
            updateInfoBox(`Converted datetime to timestamp ${timestamp} (UTC)`, 'success');
        } catch (error) {
            updateInfoBox(`Error: ${error.message}`, 'danger');
        }
    }
    
    // Event listeners
    timestampInput.addEventListener('input', function() {
        if (this.value) {
            timestampToDatetime(this.value);
        } else {
            datetimeInput.value = '';
            updateInfoBox('Enter a timestamp or a date to begin conversion');
        }
    });
    
    // Flag to track if we're already processing an input event
    let isUpdatingDateTime = false;

    // Handle keydown for overwrite mode
    datetimeInput.addEventListener('keydown', function(e) {
        // Only handle character keys (not special keys, arrows, backspace, etc.)
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const cursorPos = this.selectionStart;
            const selectionEnd = this.selectionEnd;
            
            // If there's no selection range and cursor isn't at the end
            if (cursorPos === selectionEnd && cursorPos < this.value.length) {
                // Prevent default behavior (which is insertion)
                e.preventDefault();
                
                // Create new value with the character replacing the one at cursor position
                const newValue = this.value.substring(0, cursorPos) + 
                                e.key + 
                                this.value.substring(cursorPos + 1);
                
                // Update value
                this.value = newValue;
                
                // Move cursor forward, then skip any non-digit separators
                let newCursorPos = cursorPos + 1;
                
                // Skip ahead past any non-digit characters (like "-", ":", " ")
                while (
                    newCursorPos < this.value.length && 
                    !/\d/.test(this.value.charAt(newCursorPos))
                ) {
                    newCursorPos++;
                }
                
                this.setSelectionRange(newCursorPos, newCursorPos);
                
                // Calculate timestamp manually
                if (newValue) {
                    calculateTimestampFromDatetime(newValue);
                } else {
                    timestampInput.value = '';
                    updateInfoBox('Enter a timestamp or a date to begin conversion');
                }
            }
        }
    });
    
    // For paste operations and normal input handling
    datetimeInput.addEventListener('input', function(e) {
        // Avoid processing if the keydown handler already took care of it
        if (isUpdatingDateTime) return;
        
        if (this.value) {
            // Save cursor position
            const cursorPos = this.selectionStart;
            
            // Set flag to prevent recursive updates
            isUpdatingDateTime = true;
            
            // Use a separate function to calculate timestamp
            calculateTimestampFromDatetime(this.value);
            
            // Restore cursor position
            setTimeout(() => {
                // Get new cursor position, accounting for shortened text if needed
                let newPos = Math.min(cursorPos, this.value.length);
                
                // Skip ahead past any non-digit characters
                while (
                    newPos < this.value.length && 
                    !/\d/.test(this.value.charAt(newPos))
                ) {
                    newPos++;
                }
                
                this.setSelectionRange(newPos, newPos);
                isUpdatingDateTime = false;
            }, 0);
        } else {
            timestampInput.value = '';
            updateInfoBox('Enter a timestamp or a date to begin conversion');
            isUpdatingDateTime = false;
        }
    });
    
    // Function to calculate timestamp without modifying the datetime input
    function calculateTimestampFromDatetime(datetimeStr) {
        try {
            const selectedTimezone = timezoneSelect.value;
            let datetime;
            let format;
            
            // Try to auto-detect format
            format = detectFormat(datetimeStr);
            
            if (format) {
                datetime = dayjs.tz(datetimeStr, format, selectedTimezone);
                
                if (datetime.isValid()) {
                    // Only update the timestamp, not the datetime field
                    const timestamp = datetime.unix();
                    timestampInput.value = timestamp;
                    updateInfoBox(`Converted datetime to timestamp ${timestamp} (UTC)`, 'success');
                }
            } else {
                // Try parsing as a native Date
                const nativeDate = new Date(datetimeStr);
                if (!isNaN(nativeDate.getTime())) {
                    datetime = dayjs.tz(nativeDate, selectedTimezone);
                    const timestamp = datetime.unix();
                    timestampInput.value = timestamp;
                    updateInfoBox(`Converted datetime to timestamp ${timestamp} (UTC)`, 'success');
                }
            }
        } catch (error) {
            // Silently fail to maintain smooth typing experience
        }
    }
    
    timezoneSelect.addEventListener('change', function() {
        if (timestampInput.value) {
            timestampToDatetime(timestampInput.value);
        } else if (datetimeInput.value) {
            datetimeToTimestamp(datetimeInput.value);
        }
    });
    
    // Real-time clock update
    function startClockUpdate() {
        // Update initially
        updateTimezoneOptions();
        
        // Update every second
        setInterval(function() {
            updateTimezoneOptions();
        }, 1000);
    }
    
    // Initialize
    initTimezoneDropdown();
    startClockUpdate();
    updateInfoBox('Enter a timestamp or a date to begin conversion');
    
    // Add a current time button to help users
    const cardBody = document.querySelector('.card-body');
    const buttonRow = document.createElement('div');
    buttonRow.className = 'row mb-3';
    buttonRow.innerHTML = `
        <div class="col-md-12 text-center">
            <button class="btn btn-outline-primary" id="current-time-btn">Use Current Time</button>
        </div>
    `;
    cardBody.insertBefore(buttonRow, cardBody.firstChild);
    
    document.getElementById('current-time-btn').addEventListener('click', function() {
        const now = dayjs();
        const timestamp = now.unix();
        timestampInput.value = timestamp;
        timestampToDatetime(timestamp);
    });
});