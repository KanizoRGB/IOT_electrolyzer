# IoT Electrolyzer Dashboard Design Guidelines

## Design Approach: Design System (Utility-Focused)
**System Selected:** Material Design with industrial customization
**Justification:** Enterprise IoT monitoring requires clear data hierarchy, consistent interactions, and optimal readability for critical system monitoring.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary (Industrial Theme):**
- Background: 220 25% 8% (dark slate)
- Surface: 220 20% 12% (elevated dark)
- Primary: 200 100% 60% (electric blue for active states)
- Success: 120 60% 50% (operational green)
- Warning: 45 100% 60% (amber alerts)
- Critical: 0 75% 55% (red for dangers)

**Light Mode:**
- Background: 220 10% 98% (off-white)
- Surface: 0 0% 100% (pure white cards)
- Primary: 200 90% 45% (deeper blue)
- Text: 220 15% 20% (dark gray)

### B. Typography
**Fonts:** 
- Primary: Inter (Google Fonts) - excellent readability for data
- Monospace: JetBrains Mono - for numerical readings and timestamps
**Hierarchy:**
- Dashboard title: 2xl font-bold
- Section headers: xl font-semibold  
- Parameter labels: sm font-medium
- Data values: lg font-mono font-bold
- Alerts: base font-medium

### C. Layout System
**Spacing Units:** Tailwind 2, 4, 6, 8, 12, 16
- Card padding: p-6
- Section gaps: gap-8
- Component spacing: space-y-4
- Grid gaps: gap-6

### D. Component Library

**Navigation:**
- Fixed top navigation bar with system status indicator
- Minimal sidebar with dashboard sections (Overview, Historical, Alerts, Settings)

**Data Display Components:**
- **Real-time Cards:** Elevated surfaces (shadow-lg) showing current sensor values with trend arrows
- **Gauges:** Circular progress indicators for pressure, temperature with color-coded ranges
- **Line Charts:** Time-series data with multiple parameters, subtle grid lines
- **Status Indicators:** LED-style dots (green/yellow/red) for operational states
- **Alert Banners:** Prominent warning/error messages with dismiss actions

**Interactive Elements:**
- **Buttons:** Primary (filled), secondary (outline), icon buttons for controls
- **Toggle Switches:** For system controls and view options
- **Date/Time Pickers:** For historical data range selection

**Layout Components:**
- **Dashboard Grid:** Responsive CSS Grid (3-4 columns desktop, 1-2 mobile)
- **Parameter Cards:** Consistent card layout with icon, label, value, and trend
- **Chart Containers:** Full-width sections with proper aspect ratios

### E. Animations
**Minimal Implementation:**
- Smooth value transitions for gauge movements (0.3s ease)
- Subtle pulse effect for critical alerts
- Loading states for data fetching
- No decorative animations - focus on functional feedback

## Dashboard-Specific Guidelines

**Visual Hierarchy:**
1. Critical alerts at top (if any)
2. Primary operational parameters (voltage, current, temperature)
3. Secondary metrics (pH, flow rates, pressure)
4. Historical trend section
5. System logs/status

**Data Visualization:**
- Use consistent color coding across all charts and gauges
- Implement clear threshold indicators (normal/warning/critical ranges)
- Show units prominently with each measurement
- Include timestamps for all readings

**Industrial Design Characteristics:**
- High contrast for readability in various lighting conditions
- Consistent iconography using Material Icons
- Clean, uncluttered layouts with breathing room
- Professional color scheme avoiding consumer-oriented bright colors

**Responsive Considerations:**
- Mobile: Single column layout with priority on critical parameters
- Tablet: 2-column grid maintaining readability
- Desktop: Full dashboard grid with optimal information density