const Message = ({ content, sender }) => {
  return (
    <div className="message">
      <div className="message-header">
        <span className="sender">{sender}</span>
        <span className="content">{content}</span>
      </div>
    </div>
  );
};

export { Message };
