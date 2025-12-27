let snackbarRef = null;

export function setSnackbarRef(ref) {
  snackbarRef = ref;
}

export function toastSuccess(message) {
  if (snackbarRef) snackbarRef.enqueueSnackbar(message, { variant: "success" });
}

export function toastError(message) {
  if (snackbarRef) snackbarRef.enqueueSnackbar(message, { variant: "error" });
}

export function toastInfo(message) {
  if (snackbarRef) snackbarRef.enqueueSnackbar(message, { variant: "info" });
}
