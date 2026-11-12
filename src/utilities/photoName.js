// Nombre legible de una foto: sin extensión y con espacios en lugar de guiones bajos.
const photoName = (fileName) => String(fileName ?? '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

export default photoName;
