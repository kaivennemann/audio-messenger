import { Message, LoadingMessage } from './';

const MessageStack = ({ messages, loading }) => {
    return (
        <div className="message-stack">
            {messages.length === 0 ? (
                <div className="empty-state">
                    No messages yet
                </div>
            ) : (
                messages.map((message) => (
                    <Message
                        key={message.id}
                        content={message.content}
                        sender={message.sender}
                    />
                ))
            )}
            { loading ? <LoadingMessage /> : '' }
        </div>
    );
};

export { MessageStack }