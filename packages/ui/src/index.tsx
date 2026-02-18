import type { ButtonHTMLAttributes, PropsWithChildren, ReactElement } from 'react';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

function Button({ children, ...props }: ButtonProps): ReactElement {
  return (
    <button
      {...props}
      style={{
        borderRadius: '10px',
        border: '1px solid #d4dae5',
        background: '#ffffff',
        padding: '0.5rem 0.8rem',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export { Button };
