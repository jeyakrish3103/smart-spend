import { SignIn } from '@clerk/clerk-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-base-950)] relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-brand-600)] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-accent-blue)] rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-300 to-accent-blue bg-clip-text text-transparent">
            SmartSpend
          </h1>
          <p className="text-base-400 mt-2">Take control of your finances</p>
        </div>

        {/* Clerk handles the entire login and registration flow! */}
        <SignIn 
          appearance={{
            elements: {
              card: 'bg-base-900 border border-base-800 shadow-xl rounded-2xl',
              headerTitle: 'text-base-50',
              headerSubtitle: 'text-base-400',
              socialButtonsBlockButton: 'bg-base-800 border-base-700 hover:bg-base-700 text-base-50',
              socialButtonsBlockButtonText: 'text-base-50 font-medium',
              dividerLine: 'bg-base-800',
              dividerText: 'text-base-500',
              formFieldLabel: 'text-base-300',
              formFieldInput: 'bg-base-950 border-base-800 text-base-50 focus:border-brand-500 rounded-xl',
              formButtonPrimary: 'bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-900/20 transition-all',
              footerActionText: 'text-base-400',
              footerActionLink: 'text-brand-400 hover:text-brand-300'
            }
          }}
        />
      </div>
    </div>
  );
}
