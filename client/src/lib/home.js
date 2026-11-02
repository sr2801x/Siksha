export const homeFor = (user) => (user?.role === 'teacher' ? '/teacher' : '/dashboard');
