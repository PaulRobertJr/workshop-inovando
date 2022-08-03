import DataTable from "@/components/DataTable";
import { useMutation, useQuery, useQueryClient } from "react-query";
import api from "@/services/api";
import { useCallback, useMemo, useState } from "react";
import { HStack, IconButton, useBoolean } from "@chakra-ui/react";
import { MdArrowRightAlt, MdDelete } from "react-icons/md";
import { UserResponse } from "@/typings/user";
import { toast } from "react-toastify";
import Link from "next/link";
import NameForm from "@/components/forms/NameForm";
import { format, parseISO } from "date-fns";
import ConfirmDialog from "@/components/ConfirmDialog";
import ModalFullscreen from "@/components/ModalFullscreen";
import UsersFilterForm from "@/components/forms/UsersFilterForm";
import { SubmitHandler } from "react-hook-form";
import { FormValues } from "@/components/forms/UsersFilterForm/UsersFilterForm";
import InlineEdit from "@/components/InlineEdit";

function UsersTable() {
  const perPage = 5;
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCell, setCurrentCell] = useState(null);
  const [currentText, setCurrentText] = useState("");
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [isFilterOpen, { on, off }] = useBoolean();
  const [applitedFilters, setApplitedFilters] = useState({});
  const queryClient = useQueryClient();
  const { mutateAsync, isLoading: isLoadingDeletion } = useMutation(() =>
    api.delete(`/users/${idToDelete}`)
  );

  const {
    data: users,
    isLoading,
    error,
  } = useQuery(["user", page, searchTerm, applitedFilters], () =>
    api
      .get("users", {
        params: {
          q: searchTerm,
          page,
          perPage,
          order: "created_at",
          status: true,
          ...applitedFilters,
        },
      })
      .then((response) => response.data)
  );

  const onEscapeKeypress = useCallback(() => {
    setCurrentCell(null);
    setCurrentText("");
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: (data: any) => (
          <InlineEdit
            isEditing={currentCell === data.cell.row.original.id}
            onClickEdit={() => {
              setCurrentCell(data.cell.row.original.id);
              setCurrentText(data.value);
            }}
            value={data.value}
            FormComponent={
              <NameForm
                onSubmit={(values) => {
                  api
                    .put(`users/${currentCell}`, {
                      name: values.name,
                    })
                    .catch(() => {
                      toast.error("Couldn't edit user, try again later");
                    });
                  queryClient.setQueryData(
                    ["user", page, searchTerm, applitedFilters],
                    (old: Partial<UserResponse> | undefined) => {
                      return {
                        ...old,
                        data: old?.data?.map((data) =>
                          data.id === currentCell
                            ? { ...data, name: values.name }
                            : data
                        ),
                      };
                    }
                  );
                  setCurrentCell(null);
                  setCurrentText("");
                }}
                defaultValues={{ name: currentText }}
                onEscapeKeypress={onEscapeKeypress}
              />
            }
          />
        ),
      },
      {
        Header: "Email",
        accessor: "email",
      },
      {
        Header: "Created at",
        accessor: (row: { createdAt: string }) =>
          format(parseISO(row.createdAt), "Pp"),
        id: "createdAt",
      },
      {
        Header: "Actions",
        Cell: (data: any) => (
          <HStack>
            <Link href={`/users/${data.cell.row.original.id}`} passHref>
              <IconButton
                aria-label={"Edit user"}
                icon={<MdArrowRightAlt size={22} />}
              />
            </Link>
            <IconButton
              aria-label={"Edit user"}
              onClick={() => {
                setIdToDelete(data.cell.row.original.id);
              }}
              icon={<MdDelete size={22} />}
            />
          </HStack>
        ),
      },
    ],
    [
      applitedFilters,
      currentCell,
      currentText,
      onEscapeKeypress,
      page,
      queryClient,
      searchTerm,
    ]
  );

  const onSearchDebounced = useCallback((searchTerm: string) => {
    setSearchTerm(searchTerm);
  }, []);

  const onConfirmDeletion = async () => {
    await mutateAsync();
    queryClient.invalidateQueries(["user", page, searchTerm]);
    setIdToDelete(null);
    toast.success("User deleted successfully!");
  };

  const onSubmitFilters: SubmitHandler<FormValues> = (values) => {
    setPage(1);
    setApplitedFilters(values);
    off();
  };

  const onClearFilters = () => {
    setPage(1);
    setApplitedFilters({});
    off();
  };

  if (error) {
    return (
      <div>
        An error has ocurred: "{(error as { message: string }).message}"
      </div>
    );
  }

  return (
    <>
      <ModalFullscreen title="Filters" isOpen={isFilterOpen} onClose={off}>
        <UsersFilterForm
          onClearFilters={onClearFilters}
          onSubmit={onSubmitFilters}
          defaultValues={applitedFilters}
        />
      </ModalFullscreen>
      <ConfirmDialog
        isOpen={!!idToDelete}
        onConfirm={onConfirmDeletion}
        onClose={() => setIdToDelete(null)}
        isLoading={isLoadingDeletion}
      />
      <DataTable
        columns={columns}
        data={users?.data}
        pagination={users?.pagination}
        page={page}
        onChangePage={setPage}
        perPage={perPage}
        isLoading={isLoading}
        onSearchDebounced={onSearchDebounced}
        inputPlaceholder="Search by username, email..."
        onClickFilter={on}
      />
    </>
  );
}

export default UsersTable;
