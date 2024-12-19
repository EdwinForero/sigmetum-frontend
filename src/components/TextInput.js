import React from 'react';

const TextInput = ({
    placeholderText, 
    term,
    onChange
}) => {

    return (
        <label className="form-input bg-[#F9FBFA] my-2 w-full flex resize-none overflow-hidden rounded-xl text-[#111418] focus:outline-0 focus:ring-0 border border-[#15B659] focus:border-[#15B659] h-14 placeholder:text-[#0C1811] placeholder:text-[#637588] text-base font-normal leading-normal">
            <div className="flex bg-[#F9FBFA] w-full items-stretch rounded-xl h-full">
                <input
                value={term}
                placeholder={`${placeholderText}`}
                onChange={onChange}
                className="form-input bg-[#F9FBFA] flex w-full min-w-0 resize-none overflow-hidden text-[#0C1811] focus:outline-none focus:ring-0 h-full placeholder:text-[#99BBA8] px-[15px] text-sm font-normal sm:text-base"
                />
            </div>
        </label>
    );
}

export default TextInput;