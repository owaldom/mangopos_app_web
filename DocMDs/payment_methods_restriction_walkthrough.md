# Walkthrough - Restrict Payment Methods for USD

I have successfully updated the Payment Dialog to restrict available payment methods when the selected currency is USD ("$ USD").

## Changes Implemented

### Payment Dialog Logic
- **Methods Disabled**: "Tarjeta" (Card), "Transferencia" (Transfer), and "Pago Móvil" are now disabled when USD is selected.
- **Allowed Methods**: Only "Efectivo" (Cash) and "Crédito" (Credit) remain active for USD payments.
- **Auto-Switch**: If a user is on a method like "Tarjeta" and switches the currency to USD, the system automatically switches the selected method back to "Efectivo" to prevent invalid states.

### Visual Clues
- The disabled buttons appear grayed out (opacity reduced) and are not clickable.
- The visual feedback allows the cashier to clearly see which options are valid for the selected currency.

## Verification

### Manual Verification
1.  **Open POS** and proceed to payment.
2.  **Select "$ USD"**:
    - Verify that "Tarjeta", "Pago Móvil", and "Transferencia" buttons are disabled.
    - Verify "Efectivo" and "Crédito" are active.
3.  **Select "Bs."**:
    - Verify all payment methods are active.
4.  **Test Switching**: Select "Tarjeta" in Bs, then switch to USD. Verify it automatically switches to "Efectivo".
