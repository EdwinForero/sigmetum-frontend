import React from 'react';

const SpeciesAttribute = ({
    title,
    description
}) => {
    const items = typeof description === 'string' ? description.split(',') : [];

    return (
        <details className="mb-2" open>
            <summary className="font-bold text-xl text-moss cursor-pointer">
                {title}
            </summary>
            <div className="mt-2 max-h-32 overflow-y-auto bg-surface p-2 rounded">
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <p key={index} className="text-ink text-base font-primary italic leading-normal">
                            {item.trim()}
                        </p>
                    ))
                ) : (
                    <p className="text-ink text-base font-primary italic leading-normal">{description}</p>
                )}
            </div>
        </details>
    );
};

export default SpeciesAttribute;