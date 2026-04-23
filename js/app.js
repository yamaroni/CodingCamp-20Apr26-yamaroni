// Todo List Life Dashboard Application

/**
 * StorageService - Abstracts Local Storage operations with JSON serialization
 * 
 * Provides a simple interface for storing and retrieving data from browser Local Storage
 * with automatic JSON serialization/deserialization and comprehensive error handling.
 */
class StorageService {
  /**
   * Retrieve a value from Local Storage
   * @param {string} key - The storage key to retrieve
   * @returns {any|null} The parsed value, or null if key doesn't exist or on error
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      
      // Return null for missing keys
      if (item === null) {
        return null;
      }
      
      // Parse and return the JSON data
      return JSON.parse(item);
    } catch (error) {
      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        console.error(`StorageService: Failed to parse JSON for key "${key}":`, error);
        // Clear corrupted data
        this.remove(key);
        return null;
      }
      
      // Handle other errors (e.g., storage unavailable)
      console.error(`StorageService: Error reading key "${key}":`, error);
      return null;
    }
  }

  /**
   * Store a value in Local Storage
   * @param {string} key - The storage key
   * @param {any} value - The value to store (will be JSON serialized)
   * @throws {Error} When storage quota is exceeded or storage is unavailable
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      // Handle quota exceeded errors
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('StorageService: Storage quota exceeded. Please delete old tasks or links to free up space.');
        throw new Error('Storage quota exceeded. Please delete some items to free up space.');
      }
      
      // Handle JSON serialization errors
      if (error instanceof TypeError) {
        console.error(`StorageService: Failed to serialize value for key "${key}":`, error);
        throw new Error('Failed to serialize data for storage.');
      }
      
      // Handle other errors (e.g., storage unavailable)
      console.error(`StorageService: Error writing key "${key}":`, error);
      throw new Error('Failed to save data to storage.');
    }
  }

  /**
   * Remove a key from Local Storage
   * @param {string} key - The storage key to remove
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`StorageService: Error removing key "${key}":`, error);
      // Don't throw - removal failures are non-critical
    }
  }

  /**
   * Clear all data from Local Storage
   * WARNING: This removes ALL Local Storage data, not just dashboard data
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('StorageService: Error clearing storage:', error);
      // Don't throw - clear failures are non-critical
    }
  }
}

/**
 * TimeService - Provides time-related utilities
 * 
 * Encapsulates date/time logic for consistent formatting across components
 * and provides time-of-day categorization for greeting logic.
 */
class TimeService {
  /**
   * Get the current time
   * @returns {Date} Current date/time
   */
  getCurrentTime() {
    return new Date();
  }

  /**
   * Format a date in 12-hour format with AM/PM indicator
   * @param {Date} date - The date to format
   * @returns {string} Time string in format "h:mm AM/PM" (e.g., "3:45 PM")
   */
  formatTime12Hour(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Determine AM/PM
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format (0 -> 12, 13 -> 1, etc.)
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    // Pad minutes with leading zero if needed
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  }

  /**
   * Format a date as "Day, Month Date"
   * @param {Date} date - The date to format
   * @returns {string} Date string in format "Day, Month Date" (e.g., "Monday, January 15")
   */
  formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    
    return `${dayName}, ${monthName} ${dayOfMonth}`;
  }

  /**
   * Get time-of-day category based on hour
   * @param {number} hour - Hour in 24-hour format (0-23)
   * @returns {string} Time-of-day category: "morning", "afternoon", "evening", or "night"
   */
  getTimeOfDay(hour) {
    if (hour >= 5 && hour <= 11) {
      return 'morning';
    } else if (hour >= 12 && hour <= 16) {
      return 'afternoon';
    } else if (hour >= 17 && hour <= 20) {
      return 'evening';
    } else {
      // 21-23 and 0-4
      return 'night';
    }
  }
}

/**
 * GreetingDisplay - Displays current time, date, and time-based greeting
 * 
 * Provides a real-time clock with automatic updates every second and displays
 * contextual greetings based on the time of day.
 */
class GreetingDisplay {
  /**
   * Create a GreetingDisplay instance
   * @param {HTMLElement} containerElement - The DOM element to render into
   * @param {TimeService} timeService - The time service for time operations
   */
  constructor(containerElement, timeService) {
    this.containerElement = containerElement;
    this.timeService = timeService;
    this.intervalId = null;
  }

  /**
   * Initialize the greeting display
   * Sets up the initial display and starts the clock
   */
  init() {
    // Initial render
    this.updateTime();
    // Start the clock
    this.startClock();
  }

  /**
   * Update the time display with current time, date, and greeting
   */
  updateTime() {
    const now = this.timeService.getCurrentTime();
    const time = this.timeService.formatTime12Hour(now);
    const date = this.timeService.formatDate(now);
    const greeting = this.getGreeting(now.getHours());

    // Render to DOM
    this.containerElement.innerHTML = `
      <div class="greeting">
        <h1 class="greeting__message">${greeting}</h1>
        <div class="greeting__time">${time}</div>
        <div class="greeting__date">${date}</div>
      </div>
    `;
  }

  /**
   * Get time-based greeting message
   * @param {number} hour - Hour in 24-hour format (0-23)
   * @returns {string} Greeting message appropriate for the time of day
   */
  getGreeting(hour) {
    const timeOfDay = this.timeService.getTimeOfDay(hour);
    
    switch (timeOfDay) {
      case 'morning':
        return 'Good Morning';
      case 'afternoon':
        return 'Good Afternoon';
      case 'evening':
        return 'Good Evening';
      case 'night':
        return 'Good Night';
      default:
        return 'Hello';
    }
  }

  /**
   * Start the clock with 1-second interval updates
   */
  startClock() {
    // Clear any existing interval
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    // Update every second (1000ms)
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  /**
   * Stop the clock (cleanup method)
   */
  stopClock() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize services
  const storageService = new StorageService();
  const timeService = new TimeService();
  
  // Initialize greeting component
  const greeting = new GreetingDisplay(
    document.getElementById('greeting-section'),
    timeService
  );
  greeting.init();
  
  console.log('Life Dashboard loaded');
});
