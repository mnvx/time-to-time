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
    const themeToggle = document.getElementById('theme-toggle');
    const currentYearSpan = document.getElementById('current-year');
    
    // Set current year in footer
    currentYearSpan.textContent = new Date().getFullYear();

    // Create date picker
    const calendula = new Calendula(document.getElementById('datetime'), {
        showTime: true,
        showSeconds: true,
        minuteStep: 1,
        initialDate: new Date(),
        dateFormat: 'YYYY-MM-DD HH:mm:SS',
        onChange: function(selectedDate) {
            console.log('Selected date changed:', selectedDate);
            const newValue = datetimeInput.value;
            if (newValue) {
                calculateTimestampFromDatetime(newValue);
            } else {
                timestampInput.value = '';
                updateInfoBox('Enter a timestamp or a date to begin conversion');
            }
        }
    });

    // Theme management
    function setTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('dark-theme', isDark ? 'true' : 'false');
        themeToggle.checked = isDark;
    }
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('dark-theme');
    if (savedTheme !== null) {
        setTheme(savedTheme === 'true');
    } else {
        // Use OS preference as default
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDarkScheme);
    }
    
    // Add theme toggle event listener
    themeToggle.addEventListener('change', function() {
        setTheme(this.checked);
    });
    
    // jQuery references
    const $timezoneSelect = $(timezoneSelect);
    
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
    
    // Initialize timezone dropdown with select2
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
            
            // Store data for searching and updating
            option.dataset.timezone = timezone;
            option.dataset.offset = offsetText;
            option.dataset.time = timeText;
            
            // Set plain text as the visible text (will be replaced by templateResult)
            option.textContent = timezone;
            
            if (timezone === localTimezone) {
                option.selected = true;
            }
            
            timezoneSelect.appendChild(option);
        });
        
        // Initialize select2
        $timezoneSelect.select2({
            width: '100%',
            templateResult: formatTimezoneItem,
            templateSelection: formatTimezoneSelection,
            dropdownCssClass: 'select2-dropdown-large',
            selectionCssClass: 'select2-selection-large',
            matcher: customMatcher
        });
        
        // Handle select2 events
        $timezoneSelect.on('select2:select', function() {
            if (timestampInput.value) {
                timestampToDatetime(timestampInput.value);
            } else if (datetimeInput.value) {
                datetimeToTimestamp(datetimeInput.value);
            }
        });
        
        // Auto-focus search field when dropdown is opened
        $timezoneSelect.on('select2:open', function(e) {
            const id = e.target.id;
            const target = document.querySelector(`[aria-controls=select2-${id}-results]`);
            target.focus();
        });
    }
    
    // Custom formatter for select2 dropdown items
    function formatTimezoneItem(timezone) {
        if (!timezone.id) {
            return timezone.text;
        }
        
        const option = timezone.element;
        const tzName = option.dataset.timezone;
        const offset = option.dataset.offset;
        const time = option.dataset.time;
        
        const $wrapper = $('<div class="timezone-item"></div>');
        $wrapper.append(`<span class="timezone-name">${tzName}</span>`);
        $wrapper.append(`<span class="timezone-offset">${offset}</span>`);
        $wrapper.append(`<span class="timezone-time text-secondary small">${time}</span>`);
        
        return $wrapper;
    }
    
    // Custom formatter for the selected item
    function formatTimezoneSelection(timezone) {
        if (!timezone.id) {
            return timezone.text;
        }
        
        const option = timezone.element;
        const tzName = option.dataset.timezone;
        const offset = option.dataset.offset;
        
        return `${tzName} (UTC${offset})`;
    }
    
    // Custom matcher for search functionality
    function customMatcher(params, data) {
        // If there are no search terms, return all of the data
        if ($.trim(params.term) === '') {
            return data;
        }
        
        // Skip if there is no 'id' property
        if (typeof data.id === 'undefined') {
            return null;
        }
        
        // Get the timezone data from the option
        const tzName = data.element.dataset.timezone;
        const offset = data.element.dataset.offset;
        const time = data.element.dataset.time;
        
        // Search term
        const searchTerm = params.term.toLowerCase();
        
        // Check if the timezone name, offset, or time contains the search term
        if (tzName.toLowerCase().indexOf(searchTerm) > -1 ||
            offset.indexOf(searchTerm) > -1 ||
            time.indexOf(searchTerm) > -1) {
            return data;
        }
        
        // Return `null` if the term should not be displayed
        return null;
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
            }
        });
        
        // If the timezone dropdown is open, force a redraw
        // if ($timezoneSelect.data('select2') && $timezoneSelect.data('select2').isOpen()) {
        //     $timezoneSelect.select2('close');
        //     $timezoneSelect.select2('open');
        // }
        
        // Update the selected option display
        $timezoneSelect.trigger('change.select2');
    }
    
    // Update info box
    function updateInfoBox(message, type = 'info') {
        // Add icon based on message type
        let icon = '';
        switch(type) {
            case 'success':
                icon = '<i class="bi bi-check-circle me-2"></i>';
                break;
            case 'warning':
                icon = '<i class="bi bi-exclamation-triangle me-2"></i>';
                break;
            case 'danger':
                icon = '<i class="bi bi-x-circle me-2"></i>';
                break;
            default:
                icon = '<i class="bi bi-info-circle me-2"></i>';
        }
        infoBox.innerHTML = icon + message;
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
            
            calendula.setDate(datetime.toDate());
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
        console.log(datetimeStr);
        if (!datetimeStr) {
            updateInfoBox('Invalid timestamp format', 'warning');
            return;
        }
        
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

    // console.log(datetimeInput);
    $('body #datetime').on('input', function() {
        console.log(1);
        const newValue = datetimeInput.value;
        if (newValue) {
            calculateTimestampFromDatetime(newValue);
        } else {
            timestampInput.value = '';
            updateInfoBox('Enter a timestamp or a date to begin conversion');
        }
    });

    // Handle keydown for overwrite mode
    // datetimeInput.addEventListener('keydown', function(e) {
    //     // Only handle character keys (not special keys, arrows, backspace, etc.)
    //     if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    //         const cursorPos = this.selectionStart;
    //         const selectionEnd = this.selectionEnd;
    //         console.log(cursorPos);
    //
    //         // If there's no selection range and cursor isn't at the end
    //         if (cursorPos === selectionEnd && cursorPos < this.value.length) {
    //             // Prevent default behavior (which is insertion)
    //             e.preventDefault();
    //
    //             // Create new value with the character replacing the one at cursor position
    //             const newValue = this.value.substring(0, cursorPos) +
    //                             e.key +
    //                             this.value.substring(cursorPos + 1);
    //
    //             // Update value
    //             this.value = newValue;
    //
    //             // Move cursor forward, then skip any non-digit separators
    //             let newCursorPos = cursorPos + 1;
    //
    //             // Skip ahead past any non-digit characters (like "-", ":", " ")
    //             while (
    //                 newCursorPos < this.value.length &&
    //                 !/\d/.test(this.value.charAt(newCursorPos))
    //             ) {
    //                 newCursorPos++;
    //             }
    //
    //             this.setSelectionRange(newCursorPos, newCursorPos);
    //
    //             // Calculate timestamp manually
    //             if (newValue) {
    //                 calculateTimestampFromDatetime(newValue);
    //             } else {
    //                 timestampInput.value = '';
    //                 updateInfoBox('Enter a timestamp or a date to begin conversion');
    //             }
    //         }
    //     }
    // });
    
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
                } else {
                    updateInfoBox(`Can't parse date ${datetimeStr}`, 'warning');
                }
            } else {
                // Try parsing as a native Date
                const nativeDate = new Date(datetimeStr);
                if (!isNaN(nativeDate.getTime())) {
                    datetime = dayjs.tz(nativeDate, selectedTimezone);
                    const timestamp = datetime.unix();
                    timestampInput.value = timestamp;
                    updateInfoBox(`Converted datetime to timestamp ${timestamp} (UTC)`, 'success');
                } else {
                    updateInfoBox(`Can't parse date ${datetimeStr}`, 'warning');
                }
            }
        } catch (error) {
            // Silently fail to maintain smooth typing experience
            updateInfoBox(`Can't parse date ${datetimeStr}`, 'warning');
        }
    }
    
    // No need for the native change event listener as it's handled by select2:select event
    
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
    
    document.getElementById('current-time-btn').addEventListener('click', function() {
        const now = dayjs();
        const timestamp = now.unix();
        timestampInput.value = timestamp;
        timestampToDatetime(timestamp);
    });
    $( "#current-time-btn" ).trigger( "click" );
});