export const FormatFileName = (fileName) => {
    const match = fileName.match(/(\d{4})-(\d{2})-(\d{2})_v(\d+)\.xlsx$/);
    if (!match) return fileName;

    const [, year, month, day, version] = match;
    return `${day}/${month}/${year} · V${parseInt(version, 10)}`;
}
