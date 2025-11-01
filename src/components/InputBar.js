import { useState } from 'react';

const InputBar = ({ onSend, alphabet }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = () => {
        console.log('Message submitted:', inputValue);
        onSend(inputValue);
        setInputValue('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            handleSubmit();
        }
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;

        // Filter out any characters not in the allowed alphabet
        const sanitizedValue = newValue
            .split('')
            .filter(char => alphabet.includes(char))
            .join('');

        setInputValue(sanitizedValue);
    };

    return (
        <div className="input-bar">
            <div className="input-container">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="input"
                />
                <button
                    onClick={handleSubmit}
                    className="button"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export { InputBar };