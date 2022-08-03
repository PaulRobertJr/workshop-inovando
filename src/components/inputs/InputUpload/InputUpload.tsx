import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  IconButton,
  List,
  ListIcon,
  ListItem,
  Stack,
} from "@chakra-ui/react";
import React from "react";
import { DropzoneOptions, useDropzone } from "react-dropzone";
import { Control, useController } from "react-hook-form";
import Numeral from "react-numeral";
import { MdCheckCircle, MdClose } from "react-icons/md";
import { Container } from "./styles";

type Props = {
  label: string;
  description?: string;
  name: string;
  control: Control<any>;
  helperText?: string;
} & Partial<DropzoneOptions>;

function InputUpload({
  label,
  description = "Drag 'n' drop some files here, or click to select files",
  name,
  control,
  helperText,
  ...rest
}: Props) {
  const {
    field: { onChange, value = [], ref },
    fieldState: { invalid, error },
  } = useController({
    name,
    control,
  });
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      onDrop: (acceptedFiles) => {
        onChange(acceptedFiles);
      },
      ...rest,
    });

  const files = value.map((file: File, index: number, list: Array<File>) => (
    <ListItem
      borderBottomWidth={list.length - 1 === index ? undefined : "1px"}
      borderBottomColor="gray.200"
      key={file.name}
    >
      <Box
        rounded={"md"}
        p={4}
        bgColor="#fff"
        display="flex"
        alignItems="center"
        mb={4}
      >
        <ListIcon as={MdCheckCircle} color="green.500" />
        {file.name} -{" "}
        <Box ml={1} fontWeight="bold">
          <Numeral value={file.size} format={"0.0 b"} />
        </Box>
        <IconButton
          variant="outline"
          aria-label="Delete uploaded item"
          fontSize="14px"
          size="sm"
          onClick={() => {
            onChange(
              value.filter(
                (_: File, valueIndex: number) => valueIndex !== index
              )
            );
          }}
          icon={<MdClose />}
          ml="auto"
        />
      </Box>
      <Box>
        {Array.isArray(error) && error[index] ? (
          <FormErrorMessage mt={-2} mb={4}>
            {error[index].message}
          </FormErrorMessage>
        ) : undefined}
      </Box>
    </ListItem>
  ));

  return (
    <FormControl isInvalid={invalid}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <Stack spacing={4}>
        <Container
          $isInvalid={invalid}
          {...getRootProps({ isFocused, isDragAccept, isDragReject })}
        >
          <input ref={ref} {...getInputProps()} />
          <p>{description}</p>
        </Container>
        {!!files.length && <List spacing={3}>{files}</List>}
      </Stack>
      {invalid ? (
        <FormErrorMessage>{error?.message}</FormErrorMessage>
      ) : (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
}

export default InputUpload;
