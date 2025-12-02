FROM nginx:1.25-alpine

# Remove default nginx website
RUN rm /etc/nginx/conf.d/default.conf

# Create required directories with proper permissions
RUN mkdir -p /var/log/nginx \
             /var/cache/nginx \
             /tmp \
    && touch /tmp/nginx.pid \
    && chown -R nginx:nginx /var/log/nginx \
                            /var/cache/nginx \
                            /tmp/nginx.pid

# Copy nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Ensure proper ownership
RUN chown -R nginx:nginx /etc/nginx/conf.d

# Switch to nginx user (non-root)
USER nginx

# Expose port 8080 (since non-root users can't bind to port 80)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]