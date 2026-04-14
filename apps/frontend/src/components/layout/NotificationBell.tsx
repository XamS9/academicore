import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { notificationsService } from "../../services/notifications.service";
import { evaluationsService } from "../../services/evaluations.service";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  relatedEntity: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
}

// Maps notification type → frontend route
const NOTIFICATION_LINKS: Record<string, string> = {
  GRADE_POSTED: "/mis-calificaciones",
  ENROLLMENT_CONFIRMED: "/mi-inscripcion",
  CERTIFICATION_ISSUED: "/certifications",
  ANNOUNCEMENT: "/anuncios",
  PAYMENT_DUE: "/mis-pagos",
  PAYMENT_CONFIRMED: "/mis-pagos",
};

const TYPE_LABELS: Record<string, { label: string; color: "primary" | "success" | "warning" | "error" | "default" }> = {
  GRADE_POSTED: { label: "Calificación", color: "primary" },
  ENROLLMENT_CONFIRMED: { label: "Inscripción", color: "success" },
  CERTIFICATION_ISSUED: { label: "Certificado", color: "success" },
  ANNOUNCEMENT: { label: "Anuncio", color: "default" },
  PAYMENT_DUE: { label: "Pago", color: "warning" },
  PAYMENT_CONFIRMED: { label: "Pago", color: "success" },
  GENERAL: { label: "General", color: "default" },
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchCount = useCallback(() => {
    notificationsService
      .getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  const handleOpen = async (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    try {
      const data = await notificationsService.getAll({ limit: 10 });
      setNotifications(data);
    } catch {
      /* ignore */
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleMarkAllRead = async () => {
    await notificationsService.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await notificationsService.markRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    let link = NOTIFICATION_LINKS[n.type] ?? null;

    // For grade notifications resolve the groupId so the page deep-links
    // directly to the right subject card instead of just the list view.
    if (n.type === "GRADE_POSTED" && n.relatedEntityId) {
      try {
        const evaluation = await evaluationsService.getById(n.relatedEntityId);
        if (evaluation?.groupId) {
          link = `/mis-calificaciones?groupId=${evaluation.groupId}`;
        }
      } catch {
        // fall back to the plain page
      }
    }

    if (link) {
      handleClose();
      navigate(link);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  };

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ color: "text.secondary" }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 380, maxHeight: 480 } } }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Marcar todas leídas
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 3, textAlign: "center" }}
          >
            Sin notificaciones
          </Typography>
        ) : (
          <List dense sx={{ p: 0, overflowY: "auto" }}>
            {notifications.map((n, idx) => {
              const link = NOTIFICATION_LINKS[n.type];
              const typeInfo = TYPE_LABELS[n.type];
              return (
                <Box key={n.id}>
                  <ListItem
                    onClick={() => handleNotificationClick(n)}
                    sx={{
                      bgcolor: n.isRead ? "transparent" : "action.hover",
                      cursor: link ? "pointer" : "default",
                      alignItems: "flex-start",
                      py: 1.5,
                      pr: link ? 5 : 2,
                      "&:hover": link
                        ? { bgcolor: n.isRead ? "action.hover" : "action.selected" }
                        : {},
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                          <Typography
                            variant="body2"
                            fontWeight={n.isRead ? 400 : 600}
                            component="span"
                          >
                            {n.title}
                          </Typography>
                          {typeInfo && (
                            <Chip
                              label={typeInfo.label}
                              size="small"
                              color={typeInfo.color}
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.65rem" }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {n.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.disabled"
                          >
                            {timeAgo(n.createdAt)}
                          </Typography>
                        </>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />
                    {link && (
                      <ChevronRightIcon
                        fontSize="small"
                        sx={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "text.disabled",
                        }}
                      />
                    )}
                  </ListItem>
                  {idx < notifications.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
}
