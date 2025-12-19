import { Button } from '@cloudflare/kumo';
import { GoogleLogo } from '@phosphor-icons/react/dist/csr/GoogleLogo';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginButton({ variant = 'primary', size = 'md', className = '' }) {
  const { login } = useAuth();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={login}
      className={className}
    >
      <GoogleLogo size={20} weight="bold" />
      Sign in with Google
    </Button>
  );
}
