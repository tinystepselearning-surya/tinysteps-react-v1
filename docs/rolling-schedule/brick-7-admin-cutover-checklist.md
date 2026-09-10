# Brick 7 admin cutover checklist

- [x] Remove weeks-ahead control from primary Students schedule modal.
- [x] Remove planned-class cap control and progress messaging.
- [x] Remove optional schedule end-date control.
- [x] Replace pause-next-N with indefinite Pause / Resume lifecycle actions.
- [x] Route first save of a legacy schedule to rolling activation.
- [x] Route edits of an existing rolling schedule to bounded reconciliation.
- [x] Route rolling lifecycle changes through the rolling lifecycle callable.
- [x] Remove the full enrollment-session scan used only for finite schedule statistics.
- [x] Keep legacy schedule fields readable for gradual conversion.
- [x] Keep legacy backend callables available for compatibility.
- [x] Keep production `main` untouched pending final integration approval.
