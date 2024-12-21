import React from "react";
import styled from "styled-components";

const Switch = ({ checked, onChange }) => {
  return (
    <StyledWrapper>
      <input
        type="checkbox"
        className="theme-checkbox"
        checked={checked}
        onChange={onChange}
      />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .theme-checkbox {
    --toggle-size: 10px;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 4.5em;
    height: 2.5em;
    background: linear-gradient(to right, #F9FBFA 50%, #15B659 50%) no-repeat;
    background-size: 205%;
    background-position: 0;
    transition: 0.4s;
    border-radius: 99em;
    position: relative;
    cursor: pointer;
    font-size: var(--toggle-size);
    border: 2px solid #15B659;
    box-sizing: border-box;
  }

  .theme-checkbox::before {
    content: "";
    width: 1.5em;
    height: 1.5em;
    position: absolute;
    top: 0.25em;
    left: 0.25em;
    background: linear-gradient(to right, #F9FBFA 50%, #15B659 50%) no-repeat;
    background-size: 205%;
    background-position: 100%;
    border-radius: 50%;
    transition: 0.4s;
    border: 2px solid #15B659;
    box-sizing: border-box;
  }

  .theme-checkbox:checked::before {
    left: calc(100% - 1.5em - 0.25em);
    background-position: 0;
  }

  .theme-checkbox:checked {
    background-position: 100%;
  }
`;

export default Switch;