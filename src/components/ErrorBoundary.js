import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FBFA] px-4">
          <h1 className="text-[#15B659] text-2xl font-bold mb-4">Algo salió mal</h1>
          <p className="text-[#0C1811] text-base mb-6 text-center">
            Se ha producido un error inesperado. Por favor, recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#15B659] text-[#F9FBFA] px-6 py-2 rounded-lg font-bold hover:bg-[#0e9447] transition-colors"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
