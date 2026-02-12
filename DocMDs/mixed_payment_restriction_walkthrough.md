# Walkthrough - Restrict USD in Mixed Payments

I have extended the payment method restrictions to the Mixed Payment section.

## Changes Implemented

### Mixed Payment Restrictions
- **Disabled Inputs**: The inputs for entering USD amounts for "Tarjeta" (Card), "Transferencia" (Transfer), and "Pago Móvil" are now disabled in the Mixed Payment mode.
- **Consistent Logic**: This aligns with the single payment mode restriction where these methods are not available for USD payments.
- **Enabled Inputs**: "Efectivo" (Cash) and "Crédito" (Credit) continue to accept both Bs and USD inputs.

## Verification

### Manual Verification
1.  **Open POS** and proceed to payment.
2.  Click **"Activar Pago Mixto"**.
3.  **Check USD Column** (right side inputs):
    - Verify that the USD input fields for **Tarjeta**, **Pago Móvil**, and **Transferencia** are disabled (grayed out and not editable).
    - Verify that the USD input field for **Efectivo** and **Crédito** (if customer selected) are active.
4.  **Check Bs Column**:
    - Verify all Bs inputs work as expected.
