
const Message = ({ content, sender }) => {
    return (
        <div className="message">
            <div className="message-header">
                <span className="sender">{sender}</span>
            </div>
            <p className="content">{content}</p>
        </div>
    );
};

export { Message };