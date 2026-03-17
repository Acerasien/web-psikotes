# IQ Test Configuration

When IQ Test is implemented, use these settings:

## Auto-Next Behavior
- **Auto-advance**: YES (350ms delay after answering)
- **Can go back**: NO (forward only)
- **Visual feedback**: Same as SpeedTest (card scale + pulse animation)

## Implementation Notes
- Use `StandardTest.jsx` as base component
- Set `test.settings.type = 'speed'` in database to enable auto-next
- OR create dedicated `IQTest.jsx` component similar to `SpeedTest.jsx`

## Scoring
- Total questions: 20 (placeholder - update when test is created)
- Each correct answer: 1 point
- Skipped questions: Count as wrong
- Score = correct / total questions

## PDF Report
- Already configured in `services/pdf_report.py`
- Uses `details.correct` and `total = 20`
