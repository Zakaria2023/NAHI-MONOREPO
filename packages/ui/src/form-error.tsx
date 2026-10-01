type FormErrorProps = {
  message?: string;
};

export const FormError = ({ message }: FormErrorProps) =>
  message ? <p className="text-sm text-danger">{message}</p> : null;
