import { useState } from 'react';

const InputBar = ({ onSend, alphabet, username, loading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputValue.trim() === '') return;
    console.log('Message submitted:', inputValue);
    onSend(inputValue, username);
    setInputValue('');
  };

  const handleKeyPress = e => {
    console.log('current input:', inputValue);
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      console.log('calling submit');
      handleSubmit();
    }
  };

  const handleInputChange = e => {
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
          disabled={inputValue.trim() === '' || loading}
          aria-disabled={inputValue.trim() === '' || loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export { InputBar };
