import { React, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const VegetationGallery = () => {
    const { t } = useTranslation();
    const [imageUrls, setImageUrls] = useState([]);
    const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

    useEffect(() => {
    const fetchImageUrls = async () => {
        try {
        const response = await fetch(`${BASE_URL}/list-images`);
        const data = await response.json();

        if (data.urls) {
            const filteredUrls = data.urls.filter(image => image.fileName.trim() !== "");
            setImageUrls(filteredUrls);
        }
        } catch (error) {

        }
    };

    fetchImageUrls();
    }, []);

    return (
        <>
        <h2
            className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight text-center mt-12 mb-8"
        >
            {t('gallery.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 mx-auto">
            {imageUrls.map((image) => (
                <div
                    key={image.fileName}
                    className="flex items-center justify-center overflow-hidden w-[300px] h-[300px] mx-auto"
                >
                    <img
                        src={image.url}
                        alt={image.fileName}
                        className="object-fit items-center justify-center mix-blend-multiply"
                    />
                </div>
            ))}
        </div>
    </>
    );
};

export default VegetationGallery;