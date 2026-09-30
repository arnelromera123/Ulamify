import { useState } from 'react';
import { Delete, UserCheck, X } from 'lucide-react';
import { UlamifyLogoMark } from '@/components/ulamify-logo';
import { useAuth } from '@/context/auth-context';

export function PinLoginModal() {
  const { isLoginOpen, closeLogin, loginWithPin, currentUser } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoginOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError(null);
    const success = await loginWithPin(pin);
    setLoading(false);
    if (success) {
      setPin('');
    } else {
      setError('Invalid staff PIN. Try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172039]/60 p-4 backdrop-blur-sm animate-rise">
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={closeLogin}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <span className="mx-auto mb-2 flex justify-center">
            <UlamifyLogoMark className="h-14 w-14" />
          </span>
          <h3 className="font-display text-xl font-bold">Staff PIN Login</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Current session: <strong className="text-foreground">{currentUser.name}</strong> ({currentUser.role})
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-xs font-semibold text-destructive">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-center gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <span
              key={idx}
              className={`h-3.5 w-3.5 rounded-full border border-border transition-colors ${
                pin.length > idx ? 'bg-primary border-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="flex h-12 items-center justify-center rounded-xl border border-border bg-background text-lg font-bold text-foreground transition active:scale-95 hover:bg-muted"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="flex h-12 items-center justify-center rounded-xl border border-border bg-background text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="flex h-12 items-center justify-center rounded-xl border border-border bg-background text-lg font-bold text-foreground transition active:scale-95 hover:bg-muted"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="flex h-12 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted"
            >
              <Delete size={18} />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !pin}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow transition hover:brightness-95 disabled:opacity-50"
          >
            <UserCheck size={16} />
            {loading ? 'Verifying...' : 'Enter Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
