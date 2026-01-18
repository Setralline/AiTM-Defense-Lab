/**
 * RED TEAMING DEVELOPER SIGNATURE
 * Prints a clean, badge-style credit to the browser console.
 */
export const printDeveloperSignature = () => {
  console.log(
    '%c CYBER LAB %c ARCHITECT: Osamah Amer (2026) ',

    'background: #dc2626; color: #ffffff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold; font-family: monospace;',

    'background: #1e293b; color: #ef4444; padding: 4px 8px; border-radius: 0 4px 4px 0; font-weight: bold; font-family: monospace;'
  );
  
  console.log(
    '%c SYSTEM STATUS: %c ONLINE [PROTECTED] ',
    'color: #94a3b8; font-family: monospace;',
    'color: #22c55e; font-weight: bold; font-family: monospace;'
  );
};