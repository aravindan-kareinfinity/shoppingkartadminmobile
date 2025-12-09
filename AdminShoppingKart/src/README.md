# AdminShoppingKart Source Files

This directory contains the React Native source files for the Admin Shopping Kart application.

## Files Created

### Screens
- `screens/scanner.screen.tsx` - Order search screen (search by Order ID, Group ID, or Barcode text)
- `screens/login.screen.tsx` - Login screen with mobile number input
- `screens/otplogin.screen.tsx` - OTP verification screen
- `screens/createshipment.screen.tsx` - Create/update shipment screen
- `screens/home.screen.tsx` - Home/Dashboard screen

### Services
- `services/orders.service.ts` - Orders API service
- `services/ordergroup.service.ts` - Order group API service
- `services/skubarcodemap.service.ts` - SKU barcode mapping service
- `services/users.service.ts` - Users API service (includes OTP methods)
- `services/auth.service.ts` - Authentication service (token and user management)
- `services/ordershipmentgroup.service.ts` - Order shipment group API service

### Components
- `components/forminput.component.tsx` - Form input component with label and icon support
- `components/customicons.component.tsx` - Custom icon component
- `components/bottomsheet.component.tsx` - Bottom sheet modal component

### Models
- `models/orders.model.ts` - Order types, enums, and utilities
- `models/ordershipmentgroup.model.ts` - Order shipment group enums

### Utils
- `utils/environment.ts` - Environment configuration (base URL)
- `utils/date.utils.ts` - Date formatting utilities

### Navigation
- `navigation/hometab.navigation.tsx` - Home tab navigation types
- `navigation/appstack.navigation.tsx` - App stack navigation types

### Styles
- `styles/index.ts` - Common styles and color constants

## Required Dependencies

Install these packages if not already installed:

```bash
npm install axios
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
npm install @react-native-async-storage/async-storage
```

## Notes

- The `scanner.screen.tsx` file has been recreated based on chat references. The original was 1626 lines. This version includes core functionality but may need additional features added.
- Update `utils/environment.ts` with your actual API base URL
- Some rendering functions in `scanner.screen.tsx` are simplified - you may need to add full UI rendering based on your design requirements
- The scanner screen allows manual text input for searching by Order ID, Group ID, or Barcode text (no native barcode scanner module)
