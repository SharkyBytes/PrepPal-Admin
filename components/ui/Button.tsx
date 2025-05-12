import { ButtonHTMLAttributes, FC, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 text-white hover:bg-primary-700';
      case 'secondary':
        return 'bg-secondary-600 text-white hover:bg-secondary-700';
      case 'outline':
        return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-primary-600 text-white hover:bg-primary-700';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-3 py-1.5';
      case 'md':
        return 'px-4 py-2';
      case 'lg':
        return 'text-lg px-5 py-2.5';
      default:
        return 'px-4 py-2';
    }
  };

  return (
    <button
      className={`
        font-medium rounded transition duration-200
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${loading || disabled ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button; 