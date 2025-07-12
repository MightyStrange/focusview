# FocusView - Sleep Monitoring Application

## Architecture & Structure
- **Frontend**: Vanilla HTML/CSS/JS with responsive design and real-time monitoring
- **Backend**: PHP with MySQL database
- **Main Components**: 
  - Bluetooth device integration for sleep monitoring hardware
  - Real-time data collection and analytics
  - User authentication and session management
- **Database**: MySQL (`sleep_monitor` db) with tables: `users`, `sleep_monitoring`

## Core Files
- `index.html` - Login page
- `monitor.html` - Main monitoring dashboard
- `script.js` - Core application logic with real-time data handling
- `koneksi.php` - Database connection configuration
- `save_sleep_data.php` - Main data persistence endpoint
- Authentication: `login.php`, `register.php`, `settings.php`

## Testing & Deployment
- No automated testing framework (pure PHP/JS application)
- Deploy to Apache/XAMPP environment
- Test manually via browser with Bluetooth-enabled device
- Database setup required in MySQL with proper schema

## Code Style
- **PHP**: Procedural style with prepared statements, JSON API responses
- **JavaScript**: ES6+ features, camelCase naming, event-driven architecture
- **Error Handling**: Try-catch blocks, user-friendly error messages
- **Security**: Password hashing, SQL injection protection, session management
- **Data Format**: JSON for API communication, ISO timestamps for logging
